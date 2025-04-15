<template>
  <div v-if="loading" class="loading-state">加载中...</div>
  <div v-else-if="error" class="error-state">{{ error }}</div>
  <div v-else-if="userData" class="user-profile-view">
    <!-- Profile Header -->
    <div class="profile-banner">
      <!-- You might want a banner image here -->
      <!-- + Avatar Container - Make clickable for own profile -->
      <div
        class="profile-avatar-container"
        :class="{ clickable: isViewingOwnProfile }"
        @click="isViewingOwnProfile ? openAvatarDialog() : null"
      >
        <el-avatar :size="100" :src="resolvedAvatarUrl" class="profile-avatar" />
        <div v-if="isViewingOwnProfile" class="edit-icon-overlay">
          <el-icon><EditPen /></el-icon>
        </div>
      </div>
    </div>
    <div class="profile-info">
      <h2>{{ userData.name || userData.username }}</h2>
      <p class="user-bio">{{ userData.bio || '这个人很懒，什么都没留下~' }}</p>
      <div class="user-stats-tabs">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'posts' }"
          @click="setActiveTab('posts')"
        >
          <div class="tab-count">{{ userData.postCount ?? 0 }}</div>
          <div class="tab-label">动态</div>
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'followers' }"
          @click="setActiveTab('followers')"
        >
          <div class="tab-count">{{ userData.followerCount ?? 0 }}</div>
          <div class="tab-label">粉丝</div>
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'following' }"
          @click="setActiveTab('following')"
        >
          <div class="tab-count">{{ userData.followingCount ?? 0 }}</div>
          <div class="tab-label">关注</div>
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'favorites' }"
          @click="setActiveTab('favorites')"
        >
          <div class="tab-count">{{ userData.favoritesCount ?? 0 }}</div>
          <div class="tab-label">收藏</div>
        </div>
      </div>
      <!-- Add Follow/Unfollow button here -->
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
    <div class="profile-content">
      <div v-if="activeTab === 'posts'">
        <div v-if="postsLoading && postsCurrentPage === 1" class="tab-placeholder">
          正在加载帖子...
        </div>
        <div v-else-if="!postsLoading && userPosts.length === 0" class="tab-placeholder">
          该用户还没有发布任何动态哦~
        </div>
        <div v-else class="post-list">
          <PostCard
            v-for="post in userPosts"
            :key="post.id"
            :post="post"
            @card-click="goToPostDetail"
            :is-author="logIsAuthor(post)"
            @delete="handleDeletePost"
            @edit="handleEditPost"
            class="profile-post-card"
          />
          <div v-if="postsLoading && postsCurrentPage > 1" class="loading-more">加载更多...</div>
        </div>
      </div>
      <div v-if="activeTab === 'favorites'">
        <div v-if="favoritesLoading && favoritesCurrentPage === 1" class="loading-placeholder">
          正在加载收藏...
        </div>
        <div v-else-if="!favoritesLoading && userFavorites.length === 0" class="empty-placeholder">
          该用户还没有收藏任何帖子哦~
        </div>
        <div v-else class="post-list">
          <PostCard
            v-for="post in userFavorites"
            :key="`fav-${post.id}`"
            :post="post"
            @card-click="goToPostDetail"
            class="profile-post-card"
          />
          <div v-if="favoritesLoading && favoritesCurrentPage > 1" class="loading-more">
            加载更多...
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'following'">
        <div v-if="followingLoading && followingCurrentPage === 1" class="loading-placeholder">
          正在加载关注列表...
        </div>
        <div v-else-if="!followingLoading && followingList.length === 0" class="empty-placeholder">
          {{ isViewingOwnProfile ? '你' : 'TA' }}还没有关注任何人哦~
        </div>
        <div v-else class="user-list">
          <UserListItem
            v-for="user in followingList"
            :key="user.id"
            :user="user"
            :showFollowButton="userStore.isLoggedIn && userStore.currentUser?.id !== user.id"
            :isFollowing="user.isFollowing"
            :isLoading="followListItemLoading[user.id] || false"
            @toggle-follow="handleToggleFollowInList"
          />
          <div v-if="followingLoading && followingCurrentPage > 1" class="loading-more">
            加载更多...
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'followers'">
        <div v-if="followersLoading && followersCurrentPage === 1" class="loading-placeholder">
          正在加载粉丝列表...
        </div>
        <div v-else-if="!followersLoading && followersList.length === 0" class="empty-placeholder">
          {{ isViewingOwnProfile ? '你' : 'TA' }}还没有粉丝哦~
        </div>
        <div v-else class="user-list">
          <UserListItem
            v-for="user in followersList"
            :key="user.id"
            :user="user"
            :showFollowButton="userStore.isLoggedIn && userStore.currentUser?.id !== user.id"
            :isFollowing="user.isFollowing"
            :isLoading="followListItemLoading[user.id] || false"
            @toggle-follow="handleToggleFollowInList"
          />
          <div v-if="followersLoading && followersCurrentPage > 1" class="loading-more">
            加载更多...
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="not-found">用户不存在。</div>

  <!-- + Avatar Edit Dialog (Copied from ProfileSettingsView) -->
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
            <div class="el-upload__tip">只能上传 jpg/png 文件，且不超过 5MB</div>
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
            @click="pendingAvatarUrl = presetUrl"
            class="preset-avatar"
            :class="{ selected: pendingAvatarUrl === presetUrl }"
          />
          <!-- Button to select removing avatar -->
          <el-button
            text
            @click="pendingAvatarUrl = null"
            class="preset-avatar remove-avatar-btn"
            :class="{ selected: pendingAvatarUrl === null }"
            >移除头像</el-button
          >
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

  <!-- + Add Post Edit Modal -->
  <PostEditModal
    v-model:visible="isEditModalVisible"
    :post-data="editingPostData"
    @post-updated="handlePostUpdated"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, provide, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router' // Keep useRouter
import { UserService } from '@/services/UserService'
import type { UserProfileData } from '@/services/UserService'
import type { Post } from '@/types/models'
import { PostService } from '@/services/PostService' // + Import PostService
import type { PaginatedUserPostsResponse } from '@/services/PostService' // + Import response type if needed elsewhere, or rely on inference
import { useUserStore } from '@/stores/modules/user'
import {
  ElMessage,
  ElMessageBox,
  ElButton,
  ElIcon,
  ElTabs,
  ElTabPane,
  ElAvatar,
  ElDialog,
  ElUpload,
} from 'element-plus' // + Added Dialog, Upload
import type { UploadProps, UploadRawFile } from 'element-plus' // + Added Upload types
import http from '@/http'
import PostCard from '@/components/PostCard.vue'
import { Edit, Delete, EditPen } from '@element-plus/icons-vue'
import UserListItem from '@/components/user/UserListItem.vue' // + Import UserListItem
import type { UserPublicListData } from '@/services/UserService' // + Import type for user list data
import PostEditModal from '@/components/PostEditModal.vue' // + Import the new modal

const router = useRouter()
const route = useRoute()
const userId = computed(() => route.params.userId as string)
const userStore = useUserStore()

// --- State ---
const userData = ref<UserProfileData | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref('posts') // Default tab
const followLoading = ref(false)

// + Restore state for posts and favorites with pagination
const userPosts = ref<Post[]>([])
const postsLoading = ref(false)
const postsCurrentPage = ref(0) // Start at 0 to indicate not loaded yet
const postsTotalPages = ref(0)

const userFavorites = ref<Post[]>([])
const favoritesLoading = ref(false)
const favoritesCurrentPage = ref(0) // Start at 0
const favoritesTotalPages = ref(0)

// --- State for Avatar Editing (Copied) ---
const avatarDialogVisible = ref(false)
const pendingAvatarUrl = ref<string | null>(null)
const presetAvatarUrls = ref<string[]>([])

// + State for Following/Followers lists
const followingList = ref<UserPublicListData[]>([])
const followersList = ref<UserPublicListData[]>([])
const followingLoading = ref(false)
const followersLoading = ref(false)
const followingCurrentPage = ref(0)
const followersCurrentPage = ref(0)
const followingTotalPages = ref(0)
const followersTotalPages = ref(0)
const followListItemLoading = ref<Record<number, boolean>>({})

// + State for edit modal
const isEditModalVisible = ref(false)
const editingPostData = ref<Post | null>(null)

// --- Computed ---
// + Check if viewing own profile
const isViewingOwnProfile = computed(() => {
  return userStore.isLoggedIn && userStore.currentUser?.id === Number(userId.value)
})

const showFollowButton = computed(() => {
  return (
    userStore.isLoggedIn &&
    userStore.currentUser &&
    userStore.currentUser.id !== Number(userId.value)
  )
})
const resolvedAvatarUrl = computed(() => {
  const url = userData.value?.avatarUrl
  let finalUrl

  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    // Absolute URL
    finalUrl = url
  } else {
    // Relative URL (including null/undefined or paths like /uploads/..., /avatars/defaults/...)
    const apiBaseUrl = http.defaults.baseURL || '' // e.g., http://localhost:3001/api
    const staticBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '') // e.g., http://localhost:3001
    const path = url || '/avatars/defaults/default_avatar.png' // Use default if url is null/undefined
    const relativeUrl = path.startsWith('/') ? path : '/' + path
    finalUrl = `${staticBaseUrl}${relativeUrl}`
  }

  const cacheBuster = `?t=${Date.now()}`
  // Ensure cache buster is added correctly even if finalUrl already has params (though unlikely here)
  return finalUrl.includes('?')
    ? `${finalUrl}&${cacheBuster.substring(1)}`
    : `${finalUrl}${cacheBuster}`
})

// --- Computed for Avatar Upload (Copied) ---
const uploadUrl = computed(() => UserService.getUploadAvatarUrl())

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`,
}))

// --- Methods ---
const setActiveTab = (tabName: string) => {
  if (['posts', 'favorites', 'following', 'followers'].includes(tabName)) {
    // 只更新 activeTab 值，让 watcher 处理数据加载
    activeTab.value = tabName
    // Update URL query parameter without full page reload
    router.replace({ query: { ...route.query, tab: tabName } })
    // 注意：不再在这里调用 loadTabData，避免重复加载
  }
}

// 注释：loadUserProfile 函数已被 fetchUserProfile 函数替代

// 注释：loadContentForTab 函数已被 loadTabData 函数替代

// 注释：loadUserPosts 函数已被 fetchUserPosts 函数替代

// 注释：loadUserFavorites 函数已被 fetchUserFavorites 函数替代

// Keep goToPostDetail for card clicks
const goToPostDetail = (postId: number) => {
  console.log(`[UserProfileView] goToPostDetail triggered with postId: ${postId}`)
  if (postId) {
    console.log(`[UserProfileView] Preparing to call router.push in nextTick for id: ${postId}`)
    // + Wrap router.push in nextTick
    nextTick(() => {
      try {
        console.log(
          `[UserProfileView] Executing router.push inside nextTick for PostDetail with id: ${postId}`,
        )
        router.push({ name: 'PostDetail', params: { id: postId } })
      } catch (e) {
        console.error('[UserProfileView] Error during router.push:', e)
      }
    })
  } else {
    console.warn('[UserProfileView] goToPostDetail called with invalid postId:', postId)
  }
}

// Keep simplified confirmDeletePost for button binding (will need PostService later)
const confirmDeletePost = (postId: number) => {
  ElMessageBox.confirm('确定要删除这篇帖子吗？', '确认删除', { type: 'warning' })
    .then(async () => {
      ElMessage.info('删除功能待恢复')
      // try { await PostService.deletePost(postId); ... refresh ... } catch ...
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

// + Update handleEditPost to open modal
const handleEditPost = (postId: number) => {
  console.log(`[UserProfileView] handleEditPost called for ID: ${postId}`)
  const postToEdit = userPosts.value.find((p) => p.id === postId)
  if (postToEdit) {
    editingPostData.value = postToEdit
    isEditModalVisible.value = true
  } else {
    console.warn(`[UserProfileView] Post with ID ${postId} not found for editing.`)
    ElMessage.error('找不到要编辑的帖子')
  }
}

const toggleFollow = async () => {
  if (!userData.value || !showFollowButton.value) return
  followLoading.value = true
  const targetUserId = Number(userId.value)
  try {
    if (userData.value.isFollowing) {
      await UserService.unfollowUser(targetUserId)
      if (userData.value) {
        userData.value.isFollowing = false
        userData.value.followerCount--
      }
      ElMessage.success('已取消关注')
    } else {
      await UserService.followUser(targetUserId)
      if (userData.value) {
        userData.value.isFollowing = true
        userData.value.followerCount++
      }
      ElMessage.success('关注成功')
    }
  } catch (err: any) {
    console.error('Follow/Unfollow failed:', err)
    ElMessage.error('操作失败')
  } finally {
    followLoading.value = false
  }
}

// --- Methods for Avatar Editing (Copied) ---
const fetchPresetAvatars = async () => {
  try {
    console.log('[UserProfileView] Calling UserService.getDefaultAvatars...')
    const rawPresetUrls = await UserService.getDefaultAvatars()
    console.log(
      '[UserProfileView] Raw response from UserService.getDefaultAvatars():',
      JSON.stringify(rawPresetUrls, null, 2),
    )
    presetAvatarUrls.value = rawPresetUrls.avatarUrls
    console.log('[UserProfileView] Assigned preset avatars to ref:', presetAvatarUrls.value)
  } catch (error) {
    console.error('[UserProfileView] Failed to fetch preset avatars:', error)
    // Don't necessarily show error message here unless dialog is open
  }
}

const resolveStaticAssetUrl = (url: string | null | undefined): string => {
  let finalUrl

  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    // Absolute URL
    finalUrl = url
  } else {
    // Relative URL (including null/undefined or paths like /uploads/..., /avatars/defaults/...)
    const apiBaseUrl = http.defaults.baseURL || '' // e.g., http://localhost:3001/api
    const staticBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '') // e.g., http://localhost:3001
    const path = url || '/avatars/defaults/default_avatar.png' // Use default if url is null/undefined
    const relativeUrl = path.startsWith('/') ? path : '/' + path
    finalUrl = `${staticBaseUrl}${relativeUrl}`
  }

  const cacheBuster = `?t=${Date.now()}`
  // Ensure cache buster is added correctly even if finalUrl already has params
  return finalUrl.includes('?')
    ? `${finalUrl}&${cacheBuster.substring(1)}`
    : `${finalUrl}${cacheBuster}`
}

const openAvatarDialog = () => {
  if (!isViewingOwnProfile.value) return
  pendingAvatarUrl.value = userStore.currentUser?.avatarUrl || null
  // Fetch presets if not already loaded or if needed
  if (presetAvatarUrls.value.length === 0) {
    fetchPresetAvatars() // Fetch if empty
  }
  avatarDialogVisible.value = true
}

const handleAvatarSuccess: UploadProps['onSuccess'] = (response, uploadFile) => {
  console.log('[UserProfileView] Avatar Upload Success Response:', response)
  if (response && typeof response.avatarUrl === 'string') {
    pendingAvatarUrl.value = response.avatarUrl
    ElMessage.success('头像上传成功! 请点击保存以应用更改。')
  } else {
    console.error('[UserProfileView] Invalid response from avatar upload:', response)
    ElMessage.error(response?.message || '头像上传失败，响应数据无效')
  }
}

const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) => {
  const isImage = rawFile.type.startsWith('image/')
  const isLt5M = rawFile.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
  }
  return isImage && isLt5M
}

const saveAvatarSelection = async () => {
  const currentStoredUrl = userStore.currentUser?.avatarUrl || null
  const urlToSave: string | null =
    pendingAvatarUrl.value === undefined ? null : pendingAvatarUrl.value

  if (urlToSave === currentStoredUrl) {
    avatarDialogVisible.value = false
    return
  }
  console.log('[UserProfileView] Saving avatar selection. New URL to save:', urlToSave)
  try {
    const response = await UserService.updateMyProfile({ avatarUrl: urlToSave })
    console.log(
      '[UserProfileView] Received user data after update:',
      JSON.stringify(response?.user, null, 2),
    )
    if (response && response.user) {
      userStore.setUser(response.user) // Update store, triggers reactivity
      if (isViewingOwnProfile.value && userData.value) {
        console.log('[UserProfileView] Updating local userData.avatarUrl for sync.')
        userData.value.avatarUrl =
          response.user.avatarUrl === undefined ? null : response.user.avatarUrl
      }
      ElMessage.success('头像更新成功!')
      avatarDialogVisible.value = false
    } else {
      throw new Error('Invalid response after updating profile')
    }
  } catch (error: any) {
    console.error('Failed to update avatar:', error)
    ElMessage.error(error.response?.data?.message || error.message || '头像更新失败')
  }
}

// 注释：loadFollowingList 和 loadFollowersList 函数已被 fetchFollowing 和 fetchFollowers 函数替代

// + Add method to handle follow/unfollow clicks from the list
const handleToggleFollowInList = async (targetUserId: number) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  // Set loading state for the specific button
  followListItemLoading.value[targetUserId] = true

  try {
    // Determine if we are currently following this user from the list data
    const list = activeTab.value === 'following' ? followingList.value : followersList.value
    const userInList = list.find((u) => u.id === targetUserId)
    if (!userInList) return // Should not happen

    const currentlyFollowing = userInList.isFollowing

    if (currentlyFollowing) {
      await UserService.unfollowUser(targetUserId)
      userInList.isFollowing = false
      if (userData.value && userData.value.id === targetUserId) {
        userData.value.isFollowing = false
        userData.value.followerCount = Math.max(0, (userData.value.followerCount ?? 0) - 1)
      }
      // Update logged-in user's following count locally if viewing own profile
      if (isViewingOwnProfile.value && userData.value) {
        userData.value.followingCount = Math.max(0, (userData.value.followingCount ?? 0) - 1)
      }
      // No easy way to update other user's follower count in store without full reload/refetch
      ElMessage.success('已取消关注')
    } else {
      await UserService.followUser(targetUserId)
      userInList.isFollowing = true
      if (userData.value && userData.value.id === targetUserId) {
        userData.value.isFollowing = true
        userData.value.followerCount = (userData.value.followerCount ?? 0) + 1
      }
      // Update logged-in user's following count locally if viewing own profile
      if (isViewingOwnProfile.value && userData.value) {
        userData.value.followingCount = (userData.value.followingCount ?? 0) + 1
      }
      ElMessage.success('关注成功')
    }

    // Counts are now updated locally, removed redundant fetch
  } catch (err) {
    console.error(`Toggle follow failed for user ${targetUserId}:`, err)
    ElMessage.error('操作失败')
  } finally {
    // Reset loading state for the specific button
    followListItemLoading.value[targetUserId] = false
  }
}

// Helper to reset pagination and data for all tabs
const resetPaginationAndData = () => {
  userPosts.value = []
  postsCurrentPage.value = 0
  postsTotalPages.value = 0
  userFavorites.value = []
  favoritesCurrentPage.value = 0
  favoritesTotalPages.value = 0
  followingList.value = []
  followingCurrentPage.value = 0
  followingTotalPages.value = 0
  followersList.value = []
  followersCurrentPage.value = 0
  followersTotalPages.value = 0
}

// Fetch user posts (paginated)
const fetchUserPosts = async (page: number = 1, append: boolean = false) => {
  if (!userId.value) return
  postsLoading.value = true
  try {
    // Assuming PostService.getPostsByUserId returns { posts: Post[], pagination: { currentPage: number, totalPages: number } }
    const response = await PostService.getPostsByUserId(Number(userId.value), page, 9) // Example limit: 9 posts per page
    if (append) {
      userPosts.value.push(...response.posts)
    } else {
      userPosts.value = response.posts
    }
    postsCurrentPage.value = response.currentPage // Use correct pagination field name
    postsTotalPages.value = response.totalPages // Use correct pagination field name
  } catch (err) {
    console.error('Failed to fetch user posts:', err)
    ElMessage.error('加载帖子列表失败')
  } finally {
    postsLoading.value = false
  }
}

// Fetch user favorites (paginated)
const fetchUserFavorites = async (page: number = 1, append: boolean = false) => {
  if (!userId.value) return
  favoritesLoading.value = true
  try {
    // Assuming PostService.getUserFavoritePosts returns { posts: Post[], pagination: { currentPage: number, totalPages: number } }
    const response = await PostService.getFavoritedPosts(Number(userId.value), page, 9)
    if (append) {
      userFavorites.value.push(...response.posts)
    } else {
      userFavorites.value = response.posts
    }
    favoritesCurrentPage.value = response.currentPage
    favoritesTotalPages.value = response.totalPages
  } catch (err) {
    console.error('Failed to fetch user favorites:', err)
    ElMessage.error('加载收藏列表失败')
  } finally {
    favoritesLoading.value = false
  }
}

// Fetch following list (paginated)
const fetchFollowing = async (page: number = 1, append: boolean = false) => {
  if (!userId.value) return
  followingLoading.value = true
  try {
    const response = await UserService.getFollowing(Number(userId.value), page, 15)
    if (append) {
      followingList.value.push(...(response.following || []))
    } else {
      followingList.value = response.following || []
    }
    followingCurrentPage.value = response.currentPage
    followingTotalPages.value = response.totalPages
  } catch (err) {
    console.error('Failed to fetch following list:', err)
    ElMessage.error('加载关注列表失败')
  } finally {
    followingLoading.value = false
  }
}

// Fetch followers list (paginated)
const fetchFollowers = async (page: number = 1, append: boolean = false) => {
  if (!userId.value) return
  followersLoading.value = true
  try {
    const response = await UserService.getFollowers(Number(userId.value), page, 15)
    if (append) {
      followersList.value.push(...(response.followers || []))
    } else {
      followersList.value = response.followers || []
    }
    followersCurrentPage.value = response.currentPage
    followersTotalPages.value = response.totalPages
  } catch (err) {
    console.error('Failed to fetch followers list:', err)
    ElMessage.error('加载粉丝列表失败')
  } finally {
    followersLoading.value = false
  }
}

// Load data based on the active tab
const loadTabData = (tabName: string) => {
  const numericUserId = Number(userId.value)
  if (isNaN(numericUserId)) {
    console.error('[UserProfileView] Invalid user ID for loading content')
    return
  }

  console.log(`[UserProfileView] Loading data for tab: ${tabName}`)
  switch (tabName) {
    case 'posts':
      // 始终加载数据，不再检查 postsCurrentPage
      fetchUserPosts(1)
      break
    case 'favorites':
      // 始终加载数据，不再检查 favoritesCurrentPage
      fetchUserFavorites(1)
      break
    case 'following':
      // 始终加载数据，不再检查 followingCurrentPage
      fetchFollowing(1)
      break
    case 'followers':
      // 始终加载数据，不再检查 followersCurrentPage
      fetchFollowers(1)
      break
  }
}

// Fetch User Profile Data
const fetchUserProfile = async (id: number) => {
  loading.value = true
  error.value = null
  userData.value = null // Reset user data before fetch
  try {
    console.log(`[UserProfileView] Fetching profile for user ID: ${id}`)
    // 使用正确的 Service 方法获取用户公开信息
    userData.value = await UserService.getUserProfile(id)
    console.log('[UserProfileView] User profile data fetched:', userData.value)

    // 重置分页和数据
    resetPaginationAndData()

    // 确定要显示的标签页
    const tabFromQuery = route.query.tab as string
    const validTabs = ['posts', 'favorites', 'following', 'followers']
    const initialTab = validTabs.includes(tabFromQuery) ? tabFromQuery : 'posts'

    // 如果标签页与当前不同，设置新标签页（会触发 watcher 加载数据）
    if (initialTab !== activeTab.value) {
      activeTab.value = initialTab
    } else {
      // 如果标签页相同，手动加载数据
      loadTabData(activeTab.value)
    }
  } catch (err: any) {
    console.error(`[UserProfileView] Error fetching profile for user ${id}:`, err)
    error.value =
      err.response?.status === 404
        ? '用户不存在。'
        : err.response?.data?.message || '加载用户信息时出错'
  } finally {
    loading.value = false
  }
}

// Watch for route param changes to refetch data
watch(
  userId,
  (newUserId) => {
    if (newUserId) {
      // Ensure newUserId is treated as a number
      const numericUserId = Number(newUserId)
      if (!isNaN(numericUserId)) {
        fetchUserProfile(numericUserId)
      } else {
        console.error(`[UserProfileView] Invalid user ID detected in route: ${newUserId}`)
        error.value = '无效的用户ID'
        loading.value = false
      }
    }
  },
  { immediate: true },
) // immediate: true to run on initial load

// Watch for active tab changes to load data
watch(activeTab, (newTab, oldTab) => {
  if (newTab && newTab !== oldTab) {
    loadTabData(newTab)
    // Update URL query parameter without reloading page
    router.replace({ query: { ...route.query, tab: newTab } })
  }
})

// Watch for route query changes to update the active tab
watch(
  () => route.query.tab,
  (newTabQuery) => {
    const validTabs = ['posts', 'favorites', 'following', 'followers']
    if (
      typeof newTabQuery === 'string' &&
      validTabs.includes(newTabQuery) &&
      newTabQuery !== activeTab.value
    ) {
      activeTab.value = newTabQuery
      // The activeTab watcher will handle loading the content
    }
  },
)

// + Add missing logIsAuthor function
const logIsAuthor = (post: Post): boolean => {
  if (!post || userStore.currentUser === null) return false
  const postAuthorId = Number(post.authorId)
  const currentUserId = Number(userStore.currentUser?.id)
  const isAuthor =
    isViewingOwnProfile.value &&
    !isNaN(postAuthorId) &&
    !isNaN(currentUserId) &&
    postAuthorId === currentUserId
  // console.log(
  //   `[UserProfileView] logIsAuthor: PostID=${post.id}, ` +
  //   `post.authorId=${post.authorId} (type: ${typeof post.authorId}), ` +
  //   `converted postAuthorId=${postAuthorId} (type: ${typeof postAuthorId}), ` +
  //   `currentUserId=${userStore.currentUser?.id} (type: ${typeof userStore.currentUser?.id}), ` +
  //   `converted currentUserId=${currentUserId} (type: ${typeof currentUserId}), ` +
  //   `isViewingOwn=${isViewingOwnProfile.value} => isAuthorResult=${isAuthor}`
  // ); // Keep console log commented out for now
  return isAuthor
}

// Add missing handlers
const handleDeletePost = async (postId: number) => {
  console.log(`[UserProfileView] handleDeletePost called for ID: ${postId}`)
  try {
    await ElMessageBox.confirm('确定要永久删除这篇帖子吗？此操作无法撤销。', '确认删除', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    // Actual deletion logic
    try {
      await PostService.deletePost(postId)
      userPosts.value = userPosts.value.filter((p) => p.id !== postId)
      // Update user's post count locally if userData exists
      if (userData.value && typeof userData.value.postCount === 'number') {
        userData.value.postCount = Math.max(0, userData.value.postCount - 1)
      }
      ElMessage.success('帖子删除成功')
    } catch (deleteError: any) {
      console.error(`Failed to delete post ${postId}:`, deleteError)
      ElMessage.error(deleteError.response?.data?.message || '删除帖子失败')
    }
  } catch (cancel) {
    // User clicked cancel
    ElMessage.info('已取消删除')
  }
}

// + Add handler for post-updated event from modal
const handlePostUpdated = (updatedPost: Post) => {
  console.log('[UserProfileView] handlePostUpdated called with:', updatedPost)
  const index = userPosts.value.findIndex((p) => p.id === updatedPost.id)
  if (index !== -1) {
    // Replace the old post object with the updated one for reactivity
    userPosts.value.splice(index, 1, updatedPost)
    ElMessage.success('帖子列表已更新')
  } else {
    console.warn(
      '[UserProfileView] Updated post not found in local list, list might be out of sync.',
    )
    // Optionally refetch the list here if needed
    // fetchUserPosts(postsCurrentPage.value || 1);
  }
  // Modal closing is handled by the modal itself via emit('update:visible', false)
}

// --- Lifecycle & Watchers ---
onMounted(() => {
  // userId watcher with immediate:true handles initial load
  fetchPresetAvatars() // Still fetch presets on mount
})
</script>

<style scoped lang="scss">
// Add clickable style for stats
.clickable-stat {
  cursor: pointer;
  &:hover {
    color: var(--el-color-primary);
  }
}

// Styles for loading/empty states within tabs
.tab-placeholder {
  text-align: center;
  padding: 40px 20px;
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

.user-profile-view {
  max-width: 960px;
  margin: 20px auto;
  padding-bottom: 40px; // Add padding at the bottom
}

.loading-state,
.error-state,
.not-found {
  text-align: center;
  padding: 40px;
  color: var(--el-text-color-secondary);
}

.profile-banner {
  height: 180px; // Slightly taller banner
  background-color: #e0e4e9; // Softer placeholder color
  background-image: url('/assets/images/default-banner.jpg'); // Example default banner path
  background-size: cover;
  background-position: center;
  position: relative;
  margin-bottom: 70px; // Increased space for larger avatar overlap
  border-radius: var(--el-border-radius-base);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); // Subtle shadow
}

.profile-avatar-container {
  position: absolute;
  bottom: -60px;
  left: 40px;
  border-radius: 50%; // Ensure container is round for hover effect
  transition: filter 0.2s ease;
  .profile-avatar {
    display: block; // Remove potential inline spacing issues
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
    pointer-events: none; // Allow clicks to pass through to container
    font-size: 24px; // Adjust icon size
  }
  &.clickable {
    cursor: pointer;
    &:hover .edit-icon-overlay {
      opacity: 1;
    }
    &:hover .profile-avatar {
      filter: brightness(0.9); // Slightly darken avatar on hover
    }
  }
}

.profile-info {
  padding: 10px 40px 20px; // Adjust padding, top padding less needed due to avatar overlap
  position: relative; // Needed for absolute positioning of the button

  h2 {
    font-size: 2rem; // Larger name
    font-weight: 700; // Bolder
    margin: 0 0 10px;
    line-height: 1.2;
  }
  .user-bio {
    color: var(--el-text-color-secondary);
    margin-bottom: 18px;
    font-size: 0.95rem;
    min-height: 20px; // Ensure space even if bio is empty
  }
  .user-stats-tabs {
    display: flex;
    gap: 0;
    margin-top: 15px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--el-border-color-light);

    .tab-item {
      cursor: pointer;
      padding: 10px 20px;
      text-align: center;
      position: relative;
      transition: all 0.3s ease;

      &:hover {
        color: var(--el-color-primary);
      }

      &.active {
        color: var(--el-color-primary);

        &:after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: var(--el-color-primary);
        }
      }

      .tab-count {
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 2px;
      }

      .tab-label {
        font-size: 14px;
      }
    }
  }
  .el-button {
    // Follow button positioning
    position: absolute;
    top: 10px; // Adjust vertical position
    right: 40px;
    min-width: 80px; // Ensure minimum width
  }
}

.profile-content {
  margin-top: 25px; // Add some space above the content
  padding: 0 20px;
}

.loading-placeholder,
.empty-placeholder,
.loading-more {
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
  width: 100%;
}

.profile-post-card {
  margin-bottom: 0; // Remove margin as gap is handled by grid
}

// + Styles for Avatar Dialog (Copied and adapted)
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
        // Add specific styles for the remove button if needed
        height: 64px; // Match avatar size + border
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
