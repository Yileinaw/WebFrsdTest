<template>
  <div v-if="loading" class="loading-state">加载中...</div>
  <div v-else-if="error" class="error-state">{{ error }}</div>
  <div v-else-if="userData" class="user-profile-view">
    <!-- Profile Header -->
    <div class="profile-banner">
      <div class="profile-avatar-container" :class="{ 'clickable': isViewingOwnProfile }" @click="isViewingOwnProfile ? openAvatarDialog() : null">
        <el-avatar :size="100" :src="resolvedAvatarUrl" class="profile-avatar" />
        <div v-if="isViewingOwnProfile" class="edit-icon-overlay">
          <el-icon><EditPen /></el-icon>
        </div>
      </div>
    </div>
    <div class="profile-info">
      <h2>{{ userData.name || userData.username }}</h2>
      <p class="user-bio">{{ userData.bio || '这个人很懒，什么都没留下~' }}</p>
      <div class="user-stats">
        <span><strong>{{ userData.postCount ?? 0 }}</strong> 动态</span>
        <span @click="activeTab = 'followers'" class="clickable-stat"><strong>{{ userData.followerCount ?? 0 }}</strong> 粉丝</span>
        <span @click="activeTab = 'following'" class="clickable-stat"><strong>{{ userData.followingCount ?? 0 }}</strong> 关注</span>
        <span @click="activeTab = 'favorites'" class="clickable-stat"><strong>{{ userData.favoritesCount ?? 0 }}</strong> 收藏</span>
      </div>
      <el-button 
        v-if="showFollowButton" 
        :type="userData.isFollowing ? 'default' : 'primary'"
        @click="toggleFollow"
        :loading="followLoading"
      >
        {{ userData.isFollowing ? '已关注' : '关注' }}
      </el-button>
    </div>

    <!-- User Content (e.g., Posts) -->
    <el-tabs v-model="activeTab" class="profile-tabs">
      <el-tab-pane label="动态" name="posts">
        <div v-if="postsLoading && postsCurrentPage === 1" class="tab-placeholder">正在加载帖子...</div>
        <div v-else-if="!postsLoading && userPosts.length === 0" class="tab-placeholder">该用户还没有发布任何动态哦~</div>
        <div v-else class="post-list"> 
           <PostCard
             v-for="post in userPosts" 
             :key="post.id"
             :post="post"
             @card-click="goToPostDetail"
             @delete="handleDeletePost" 
             @edit="handleEditPost"
             class="profile-post-card"
           />
           <div v-if="postsLoading && postsCurrentPage > 1" class="loading-more">加载更多...</div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="收藏" name="favorites">
        <!-- ... favorites list ... -->
      </el-tab-pane>
       <el-tab-pane label="关注" name="following">
         <!-- ... following list ... -->
       </el-tab-pane>
       <el-tab-pane label="粉丝" name="followers">
         <!-- ... followers list ... -->
      </el-tab-pane>
    </el-tabs>

  </div>
  <div v-else class="not-found">用户不存在。</div>

  <!-- Avatar Edit Dialog -->
  <el-dialog v-model="avatarDialogVisible" title="修改头像" width="500px" class="avatar-dialog">
    <div class="dialog-content">
      <!-- Preview of pending avatar -->
      <div class="preview-section">
        <label>预览</label>
        <el-avatar :size="120" :src="resolveStaticAssetUrl(pendingAvatarUrl)" />
      </div>

      <!-- Upload New Avatar -->
      <div class="setting-item avatar-upload-dialog">
        <label>上传新头像</label>
        <el-upload
          class="avatar-uploader-dialog"
          :action="uploadUrl"
          :show-file-list="false"
          :headers="uploadHeaders"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload"
          name="avatar"
        >
          <el-button type="primary">点击上传</el-button>
          <template #tip>
            <div class="el-upload__tip">
              只能上传 jpg/png 文件，且不超过 5MB
            </div>
          </template>
        </el-upload>
      </div>

      <!-- Default Avatars Selection -->
      <div class="setting-item default-avatars">
        <label>选择预设头像</label>
        <div class="avatar-options">
          <el-avatar 
            v-for="presetUrl in presetAvatarUrls" 
            :key="presetUrl" 
            :size="60" 
            :src="resolveStaticAssetUrl(presetUrl)" 
            @click="selectPresetOrRemove(presetUrl)"  
            class="preset-avatar"
            :class="{ 'selected': pendingAvatarUrl === presetUrl }"
          />
          <el-button text @click="selectPresetOrRemove(null)" class="preset-avatar remove-avatar-btn" :class="{ 'selected': pendingAvatarUrl === null }">移除头像</el-button>
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="avatarDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAvatarSelection">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, provide, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { UserService } from '@/services/UserService';
import type { UserProfileData, UserPublicListData } from '@/services/UserService';
import type { Post } from '@/types/models';
import { PostService } from '@/services/PostService';
import { useUserStore } from '@/stores/modules/user';
import { ElMessage, ElMessageBox, ElButton, ElIcon, ElTabs, ElTabPane, ElAvatar, ElDialog, ElUpload } from 'element-plus';
import type { UploadProps, UploadRawFile } from 'element-plus';
import http from '@/http';
import PostCard from '@/components/PostCard.vue';
import { Edit, Delete, EditPen } from '@element-plus/icons-vue';
import UserListItem from '@/components/user/UserListItem.vue';

const router = useRouter();
const route = useRoute();
const userId = computed(() => route.params.userId as string);
const userStore = useUserStore();

// State
const userData = ref<UserProfileData | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref('posts');
const followLoading = ref(false);
const userPosts = ref<Post[]>([]);
const postsLoading = ref(false);
const postsCurrentPage = ref(0);
const postsTotalPages = ref(0);
const userFavorites = ref<Post[]>([]);
const favoritesLoading = ref(false);
const favoritesCurrentPage = ref(0);
const favoritesTotalPages = ref(0);
const avatarDialogVisible = ref(false);
const pendingAvatarUrl = ref<string | null>(null);
const presetAvatarUrls = ref<string[]>([]);
const followingList = ref<UserPublicListData[]>([]);
const followersList = ref<UserPublicListData[]>([]);
const followingLoading = ref(false);
const followersLoading = ref(false);
const followingCurrentPage = ref(0);
const followersCurrentPage = ref(0);
const followingTotalPages = ref(0);
const followersTotalPages = ref(0);
const followListItemLoading = ref<Record<number, boolean>>({});

// Computed
const isViewingOwnProfile = computed(() => {
  const viewingOwn = userStore.isLoggedIn && userStore.currentUser?.id === Number(userId.value);
  console.log(`[UserProfileView] Computed isViewingOwnProfile: userId=${userId.value}, currentUserId=${userStore.currentUser?.id}, isLoggedIn=${userStore.isLoggedIn}, result=${viewingOwn}`);
  return viewingOwn;
});

const showFollowButton = computed(() => {
  return userStore.isLoggedIn && userStore.currentUser && userStore.currentUser.id !== Number(userId.value);
});

const resolvedAvatarUrl = computed(() => {
    const url = userData.value?.avatarUrl;
    let finalUrl;
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        finalUrl = url;
    } else {
        const apiBaseUrl = http.defaults.baseURL || '';
        const staticBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
        const path = url || '/avatars/defaults/default_avatar.png'; 
        const relativeUrl = path.startsWith('/') ? path : '/' + path;
        finalUrl = `${staticBaseUrl}${relativeUrl}`;
    }
    const cacheBuster = `?t=${Date.now()}`;
    return finalUrl.includes('?') ? `${finalUrl}&${cacheBuster.substring(1)}` : `${finalUrl}${cacheBuster}`;
});

const uploadUrl = computed(() => UserService.getUploadAvatarUrl());

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}));

// Methods
const loadUserProfile = async (id: string | number) => {
    loading.value = true;
    error.value = null;
    userData.value = null;
    resetPaginationAndData(); // Reset all lists and pagination

    const initialTab = route.query.tab;
    if (initialTab && ['posts', 'favorites', 'following', 'followers'].includes(initialTab as string)) {
        activeTab.value = initialTab as string;
    } else {
        activeTab.value = 'posts';
    }

    console.log(`[UserProfileView] Loading profile for user ID: ${id}`);
    try {
        const profile = await UserService.getUserProfile(Number(id));
        userData.value = profile;
        await loadContentForTab(activeTab.value);
    } catch (err: any) {
        console.error("Failed to load user profile:", err);
        error.value = err.response?.data?.message || '加载用户信息失败';
        userData.value = null;
    } finally {
        loading.value = false;
    }
};

const loadContentForTab = async (tabName: string) => {
    const numericUserId = Number(userId.value);
    if (isNaN(numericUserId)) return;
    switch (tabName) {
        case 'posts': if (postsCurrentPage.value === 0) await fetchUserPosts(1); break;
        case 'favorites': if (favoritesCurrentPage.value === 0) await fetchUserFavorites(1); break;
        case 'following': if (followingCurrentPage.value === 0) await fetchFollowing(1); break;
        case 'followers': if (followersCurrentPage.value === 0) await fetchFollowers(1); break;
    }
};

const fetchUserPosts = async (page: number = 1, append: boolean = false) => {
    if (!userId.value) return;
    const numericUserId = Number(userId.value);
    if (isNaN(numericUserId)) return;
    if (postsLoading.value || (page > postsTotalPages.value && postsTotalPages.value !== 0 && !append)) return;

    postsLoading.value = true;
    try {
        const response = await PostService.getPostsByUserId(numericUserId, page, 9);
        console.log('[UserProfileView] Fetched user posts API response:', JSON.stringify(response, null, 2));

        const postsData = response.posts;
        const currentPageData = response.currentPage;
        const totalPagesData = response.totalPages;

        // Use nextTick after potential state changes that affect the list
        await nextTick(); 

        if (append) {
            userPosts.value.push(...postsData);
        } else {
            userPosts.value = postsData;
        }
        postsCurrentPage.value = currentPageData;
        postsTotalPages.value = totalPagesData;
        console.log('[UserProfileView] userPosts.value AFTER update:', JSON.stringify(userPosts.value, null, 2));

    } catch (err) {
        console.error('Failed to fetch user posts:', err);
        ElMessage.error('加载帖子列表失败');
    } finally {
        postsLoading.value = false;
    }
};

const fetchUserFavorites = async (page: number = 1, append: boolean = false) => {
    if (!userId.value) return;
    favoritesLoading.value = true;
    try {
        const response = await PostService.getFavoritedPosts(Number(userId.value), page, 9);
        if (append) {
            userFavorites.value.push(...response.posts);
        } else {
            userFavorites.value = response.posts;
        }
        favoritesCurrentPage.value = response.currentPage;
        favoritesTotalPages.value = response.totalPages;
    } catch (err) {
        console.error('Failed to fetch user favorites:', err);
        ElMessage.error('加载收藏列表失败');
    } finally {
        favoritesLoading.value = false;
    }
};

const fetchFollowing = async (page: number = 1, append: boolean = false) => {
    if (!userId.value) return;
    followingLoading.value = true;
    try {
        const response = await UserService.getFollowing(Number(userId.value), page, 15);
        if (append) {
            followingList.value.push(...(response.following || []));
        } else {
            followingList.value = response.following || [];
        }
        followingCurrentPage.value = response.currentPage;
        followingTotalPages.value = response.totalPages;
    } catch (err) {
        console.error('Failed to fetch following list:', err);
        ElMessage.error('加载关注列表失败');
    } finally {
        followingLoading.value = false;
    }
};

const fetchFollowers = async (page: number = 1, append: boolean = false) => {
    if (!userId.value) return;
    followersLoading.value = true;
    try {
        const response = await UserService.getFollowers(Number(userId.value), page, 15);
         if (append) {
            followersList.value.push(...(response.followers || []));
        } else {
            followersList.value = response.followers || [];
        }
        followersCurrentPage.value = response.currentPage;
        followersTotalPages.value = response.totalPages;
    } catch (err) {
        console.error('Failed to fetch followers list:', err);
        ElMessage.error('加载粉丝列表失败');
    } finally {
        followersLoading.value = false;
    }
};

const resetPaginationAndData = () => {
    userPosts.value = [];
    postsCurrentPage.value = 0;
    postsTotalPages.value = 0;
    userFavorites.value = [];
    favoritesCurrentPage.value = 0;
    favoritesTotalPages.value = 0;
    followingList.value = [];
    followingCurrentPage.value = 0;
    followingTotalPages.value = 0;
    followersList.value = [];
    followersCurrentPage.value = 0;
    followersTotalPages.value = 0;
};

const loadTabData = (tabName: string) => {
    console.log(`[UserProfileView] Loading data for tab: ${tabName}`);
    switch (tabName) {
        case 'posts': if (postsCurrentPage.value === 0) fetchUserPosts(1); break;
        case 'favorites': if (favoritesCurrentPage.value === 0) fetchUserFavorites(1); break;
        case 'following': if (followingCurrentPage.value === 0) fetchFollowing(1); break;
        case 'followers': if (followersCurrentPage.value === 0) fetchFollowers(1); break;
    }
};

const fetchUserProfile = async (id: number) => {
    loading.value = true;
    error.value = null;
    userData.value = null;
    try {
        console.log(`[UserProfileView] Fetching profile for user ID: ${id}`);
        userData.value = await UserService.getUserProfile(id);
        console.log('[UserProfileView] User profile data fetched:', userData.value);
        activeTab.value = 'posts';
        resetPaginationAndData();
        loadTabData(activeTab.value);
    } catch (err: any) {
        console.error(`[UserProfileView] Error fetching profile for user ${id}:`, err);
        error.value = err.response?.status === 404 ? '用户不存在。' : (err.response?.data?.message || '加载用户信息时出错');
    } finally {
        loading.value = false;
    }
};

const goToPostDetail = (postId: number) => {
    nextTick(() => {
        router.push({ name: 'PostDetail', params: { id: postId } });
    });
};

const toggleFollow = async () => {
    if (!userData.value || !showFollowButton.value) return;
    followLoading.value = true;
    const targetUserId = Number(userId.value);
    try {
        if (userData.value.isFollowing) {
            await UserService.unfollowUser(targetUserId);
            if (userData.value) { userData.value.isFollowing = false; userData.value.followerCount--; }
            ElMessage.success('已取消关注');
        } else {
            await UserService.followUser(targetUserId);
            if (userData.value) { userData.value.isFollowing = true; userData.value.followerCount++; }
            ElMessage.success('关注成功');
        }
    } catch (err: any) { console.error("Follow/Unfollow failed:", err); ElMessage.error('操作失败');}
    finally { followLoading.value = false; }
};

const fetchPresetAvatars = async () => {
    try {
        presetAvatarUrls.value = await UserService.getDefaultAvatars();
    } catch (error) {
        console.error('[UserProfileView] Failed to fetch preset avatars:', error);
    }
};

const resolveStaticAssetUrl = (url: string | null | undefined): string => {
    let finalUrl;
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        finalUrl = url;
    } else {
        const apiBaseUrl = http.defaults.baseURL || '';
        const staticBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
        const path = url || '/avatars/defaults/default_avatar.png'; 
        const relativeUrl = path.startsWith('/') ? path : '/' + path;
        finalUrl = `${staticBaseUrl}${relativeUrl}`;
    }
    const cacheBuster = `?t=${Date.now()}`;
    return finalUrl.includes('?') ? `${finalUrl}&${cacheBuster.substring(1)}` : `${finalUrl}${cacheBuster}`;
};

const openAvatarDialog = () => {
    if (!isViewingOwnProfile.value) return;
    pendingAvatarUrl.value = userStore.currentUser?.avatarUrl || null;
    if (presetAvatarUrls.value.length === 0) {
        fetchPresetAvatars();
    }
    avatarDialogVisible.value = true;
};

const handleAvatarSuccess: UploadProps['onSuccess'] = (response, uploadFile) => {
    console.log('[UserProfileView] Avatar Upload Success Response:', response);
    if (response && typeof response.avatarUrl === 'string') {
        pendingAvatarUrl.value = response.avatarUrl;
        // Set the flag here if needed based on your fixed save logic
        // isNewUploadPending.value = true; 
        ElMessage.success('头像上传成功! 请点击保存以应用更改。');
    } else {
        console.error('[UserProfileView] Invalid response from avatar upload:', response);
        ElMessage.error(response?.message || '头像上传失败，响应数据无效');
    }
};

const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) => {
    const isImage = rawFile.type.startsWith('image/');
    const isLt5M = rawFile.size / 1024 / 1024 < 5;
    if (!isImage) {
        ElMessage.error('只能上传图片文件!');
    }
    if (!isLt5M) {
        ElMessage.error('图片大小不能超过 5MB!');
    }
    return isImage && isLt5M;
};

const saveAvatarSelection = async () => {
    const currentStoredUrl = userStore.currentUser?.avatarUrl || null;
    const absoluteUrlSelected: string | null = pendingAvatarUrl.value ?? null;
    let payloadValue: string | null = null; // This will hold the value sent to the API

    // Calculate the payloadValue (relative path or null)
    if (absoluteUrlSelected === null) {
        payloadValue = null; // User wants to remove avatar
    } else {
        // Convert the selected absolute URL back to the expected relative path
        const apiBaseUrl = http.defaults.baseURL || '';
        const staticBaseUrl = apiBaseUrl.replace(/\/api\/?$/, ''); // Calculate static base URL

        // Normalize the absolute URL (remove potential cache buster)
        let cleanAbsoluteUrl = absoluteUrlSelected;
        const queryIndexClean = cleanAbsoluteUrl.indexOf('?');
        if (queryIndexClean !== -1) {
            cleanAbsoluteUrl = cleanAbsoluteUrl.substring(0, queryIndexClean);
        }

        if (staticBaseUrl && cleanAbsoluteUrl.startsWith(staticBaseUrl)) {
            let relativePath = cleanAbsoluteUrl.substring(staticBaseUrl.length);
            if (!relativePath.startsWith('/')) {
                relativePath = '/' + relativePath;
            }
            // Ensure it ONLY matches the expected preset path structure for validation
            if (relativePath.startsWith('/avatars/defaults/')) {
                 payloadValue = relativePath;
                 console.log(`[UserProfileView] Converted absolute URL ('${absoluteUrlSelected}') to relative path: ${payloadValue}`);
            } else {
                // If it's a URL from our server but not a default preset (e.g., an uploaded user avatar path)
                // We might still need to send the relative path.
                // Or if the backend expects *only* preset paths here, this case should error.
                // Assuming for now other relative paths might be valid if backend allows.
                payloadValue = relativePath;
                console.warn(`[UserProfileView] URL ('${absoluteUrlSelected}') converted to relative path ('${payloadValue}') but doesn't match preset structure.`);
            }

        } else {
             // If the URL doesn't start with our static base (e.g., an external URL, or if base calc failed)
             // Backend validation will likely reject this.
            console.error(`[UserProfileView] URL ('${absoluteUrlSelected}') could not be converted to a relative path starting with static base ('${staticBaseUrl}'). Cannot save.`);
            ElMessage.error('无法处理此头像URL格式，请选择预设头像或重新上传。');
            return; // Prevent API call
        }
    }

    // Now, compare the final intended payload value with the current stored value
    if (payloadValue === currentStoredUrl) {
        avatarDialogVisible.value = false;
        ElMessage.info('头像未更改');
        return;
    }

    // Log the value *actually* being sent
    console.log('[UserProfileView] Saving avatar selection. Payload value to send:', payloadValue);

    try {
        // Ensure we send the calculated payloadValue (relative path or null)
        const response = await UserService.updateMyProfile({ avatarUrl: payloadValue });
        console.log('[UserProfileView] Received user data after update:', response?.user);

        if (response && response.user) {
            userStore.setUser(response.user);
            if (isViewingOwnProfile.value && userData.value) {
                userData.value.avatarUrl = response.user.avatarUrl ?? null;
            }
            ElMessage.success('头像更新成功!');
            avatarDialogVisible.value = false;
        } else {
            console.warn('Profile updated successfully, but no user data returned in response. Refetching profile might be needed.');
            ElMessage.success('头像更新成功!');
            avatarDialogVisible.value = false;
            if (isViewingOwnProfile.value && userData.value) {
                 userData.value.avatarUrl = payloadValue;
            }
        }
    } catch (error: any) {
        console.error('Failed to update avatar:', error);
        ElMessage.error(error.response?.data?.message || error.message || '头像更新失败');
    }
};

const handleToggleFollowInList = async (targetUserId: number) => {
    if (!userStore.isLoggedIn) {
        ElMessage.warning('请先登录');
        router.push('/login');
        return;
    }
    followListItemLoading.value[targetUserId] = true;
    try {
        const list = activeTab.value === 'following' ? followingList.value : followersList.value;
        const userInList = list.find(u => u.id === targetUserId);
        if (!userInList) return;
        const currentlyFollowing = userInList.isFollowing;
        if (currentlyFollowing) {
            await UserService.unfollowUser(targetUserId);
            userInList.isFollowing = false;
            if (userData.value && userData.value.id === targetUserId) {
                userData.value.isFollowing = false;
                userData.value.followerCount = Math.max(0, (userData.value.followerCount ?? 0) - 1);
            }
            if (isViewingOwnProfile.value && userData.value) {
                userData.value.followingCount = Math.max(0, (userData.value.followingCount ?? 0) - 1);
            } 
            ElMessage.success('已取消关注');
        } else {
            await UserService.followUser(targetUserId);
            userInList.isFollowing = true;
            if (userData.value && userData.value.id === targetUserId) {
                userData.value.isFollowing = true;
             userData.value.followerCount = (userData.value.followerCount ?? 0) + 1;
            }
            if (isViewingOwnProfile.value && userData.value) {
                userData.value.followingCount = (userData.value.followingCount ?? 0) + 1;
            }
            ElMessage.success('关注成功');
        }
    } catch (err) {
        console.error(`Toggle follow failed for user ${targetUserId}:`, err);
        ElMessage.error('操作失败');
    } finally {
        followListItemLoading.value[targetUserId] = false;
    }
};

const logIsAuthor = (post: Post): boolean => {
  if (!post || userStore.currentUser === null) return false;

  // 将 post.authorId 和 currentUser.id 都转换为数字进行比较
  const postAuthorId = Number(post.authorId);
  const currentUserId = Number(userStore.currentUser?.id); // currentUser.id 应该已经是 number, 但以防万一

  // 检查转换后的数字是否有效且相等
  const isAuthor = isViewingOwnProfile.value &&
                   !isNaN(postAuthorId) && // 确保 postAuthorId 是有效数字
                   !isNaN(currentUserId) && // 确保 currentUserId 是有效数字
                   postAuthorId === currentUserId;

  // 更新日志以显示转换后的值和类型
  console.log(
    `[UserProfileView] logIsAuthor: PostID=${post.id}, ` +
    `post.authorId=${post.authorId} (type: ${typeof post.authorId}), ` +
    `converted postAuthorId=${postAuthorId} (type: ${typeof postAuthorId}), ` +
    `currentUserId=${userStore.currentUser?.id} (type: ${typeof userStore.currentUser?.id}), ` +
    `converted currentUserId=${currentUserId} (type: ${typeof currentUserId}), ` +
    `isViewingOwn=${isViewingOwnProfile.value} => isAuthorResult=${isAuthor}`
  );

  return isAuthor;
}

const handleDeletePost = async (postId: number) => {
    console.log(`[UserProfileView] handle delete for post ID: ${postId}`);
  try {
    await ElMessageBox.confirm(
      '确定要永久删除这篇帖子吗？此操作无法撤销。',
      '确认删除',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    try {
      await PostService.deletePost(postId); 
      userPosts.value = userPosts.value.filter(p => p.id !== postId);
      if (userData.value && userData.value.postCount) {
         userData.value.postCount--;
      }
      ElMessage.success('帖子删除成功');
    } catch (deleteError: any) {
      console.error(`Failed to delete post ${postId}:`, deleteError);
      ElMessage.error(deleteError.response?.data?.message || '删除帖子失败');
    }
  } catch (cancel) {
    ElMessage.info('已取消删除');
  }
};

const handleEditPost = (postId: number) => {
    console.log(`[UserProfileView] handle edit for post ID: ${postId}`);
    ElMessage.info(`编辑帖子 #${postId} 的功能待实现`);
};

const selectPresetOrRemove = (url: string | null) => {
  console.log(`[UserProfileView] Preset avatar selected or removed: ${url}`);
  pendingAvatarUrl.value = url;
};

watch(userId, (newUserId) => {
  if (newUserId) {
    const numericUserId = Number(newUserId);
    if (!isNaN(numericUserId)) {
        fetchUserProfile(numericUserId);
    } else {
        console.error(`[UserProfileView] Invalid user ID detected in route: ${newUserId}`);
        error.value = '无效的用户ID';
        loading.value = false;
    }
  }
}, { immediate: true }); 

watch(activeTab, (newTab, oldTab) => {
  if (newTab && newTab !== oldTab) {
    loadTabData(newTab);
    router.replace({ query: { ...route.query, tab: newTab } });
  }
});

watch(() => route.query.tab,
  (newTabQuery) => {
    const validTabs = ['posts', 'favorites', 'following', 'followers'];
    if (typeof newTabQuery === 'string' && validTabs.includes(newTabQuery) && newTabQuery !== activeTab.value) {
      activeTab.value = newTabQuery;
    }
  }
);

onMounted(() => {
  fetchPresetAvatars();
});

</script>

<style scoped lang="scss">
.clickable-stat {
  cursor: pointer;
  &:hover {
    color: var(--el-color-primary);
  }
}

.tab-placeholder {
  text-align: center;
  padding: 40px 20px;
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

.user-profile-view {
  max-width: 960px;
  margin: 20px auto;
  padding-bottom: 40px; 
}

.loading-state, .error-state, .not-found {
  text-align: center;
  padding: 40px;
  color: var(--el-text-color-secondary);
}

.profile-banner {
  height: 180px; 
  background-color: #e0e4e9; 
  background-image: url('/assets/images/default-banner.jpg'); 
  background-size: cover;
  background-position: center;
  position: relative;
  margin-bottom: 70px; 
  border-radius: var(--el-border-radius-base);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); 
}

.profile-avatar-container {
  position: absolute;
  bottom: -60px;
  left: 40px;
  border-radius: 50%; 
  transition: filter 0.2s ease;
  .profile-avatar {
    display: block; 
    border: 5px solid #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    background-color: #fff;
  }
  .edit-icon-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none; 
    font-size: 24px; 
  }
  &.clickable {
    cursor: pointer;
    &:hover .edit-icon-overlay {
      opacity: 1;
    }
    &:hover .profile-avatar {
       filter: brightness(0.9); 
    }
  }
}

.profile-info {
  padding: 10px 40px 20px; 
  position: relative; 

  h2 {
    font-size: 2rem; 
    font-weight: 700; 
    margin: 0 0 10px;
    line-height: 1.2;
  }
  .user-bio {
    color: var(--el-text-color-secondary);
    margin-bottom: 18px;
    font-size: 0.95rem;
    min-height: 20px; 
  }
  .user-stats {
    display: flex;
    gap: 25px; 
    margin-bottom: 20px;
    color: var(--el-text-color-regular);
    font-size: 0.9rem; 
    strong {
      font-weight: 600;
      margin-right: 5px;
      font-size: 1.1rem; 
    }
  }
  .el-button { 
      position: absolute;
      top: 10px; 
      right: 40px;
      min-width: 80px; 
  }
}

.profile-tabs {
  margin-top: 25px; 
}

.loading-placeholder, .empty-placeholder, .loading-more {
  text-align: center;
  padding: 40px 20px;
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

.post-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px; 
  padding: 10px 0; 
}

.profile-post-card {
    margin-bottom: 0; 
}

.avatar-dialog {
  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .preview-section {
    text-align: center;
    margin-bottom: 10px;
    label {
      display: block;
      margin-bottom: 10px;
      color: var(--el-text-color-secondary);
      font-size: 0.9rem;
    }
  }

  .setting-item {
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }
  }

  .default-avatars {
    .avatar-options {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      align-items: center;
      .preset-avatar {
        cursor: pointer;
        border: 2px solid transparent;
        transition: border-color 0.2s ease;
        border-radius: 50%;
        &:hover {
          border-color: var(--el-color-primary-light-5);
        }
        &.selected {
          border-color: var(--el-color-primary);
        }
      }
      .remove-avatar-btn {
        height: 64px; 
        width: 64px;
        border-radius: 50%;
        border: 2px dashed var(--el-border-color);
         &.selected {
          border-color: var(--el-color-primary);
          border-style: solid;
        }
      }
    }
  }
}
</style> 