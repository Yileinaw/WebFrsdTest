<template>
  <div class="post-detail-view">
    <!-- Add Back Button -->
    <div class="back-button-container">
      <el-button :icon="Back" @click="goBack">返回</el-button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <el-skeleton :rows="10" animated />
    </div>
    <el-alert v-else-if="error" :title="error" type="error" show-icon :closable="false" />
    <div v-else-if="post" class="post-content-area">
      <!-- Post Header -->
      <div class="post-header">
        <h1>{{ post.title }}</h1>
        <div class="meta-bar"> 
          <div class="author-info">
            <router-link :to="{ name: 'UserProfile', params: { userId: post.author?.id } }">
               <el-avatar :size="32" :src="resolveStaticAssetUrl(post.author?.avatarUrl)" class="author-avatar" />
            </router-link>
            <div class="info-text">
              <router-link :to="{ name: 'UserProfile', params: { userId: post.author?.id } }" class="author-name-link">
                 <span class="author-name">{{ post.author?.name || '匿名用户' }}</span>
              </router-link>
              <span class="publish-time">发布于 {{ formatTime(post.createdAt) }}</span>
            </div>
             <!-- + Add Follow Button Here -->
            <el-button
                v-if="showFollowAuthorButton"
                size="small"
                :type="post.author?.isFollowing ? 'default' : 'primary'"
                class="follow-button-inline"
                @click="handleFollowAuthor"
                :loading="followAuthorLoading"
            >
                {{ post.author?.isFollowing ? '已关注' : '关注' }}
            </el-button>
          </div>
          <!-- Moved Actions Here -->
          <div class="post-actions-inline">
            <el-button text :icon="post.isLiked ? StarFilled : Star" :type="post.isLiked ? 'primary' : ''" @click.stop="handleLike" :loading="isLiking">
              {{ post.likesCount || 0 }} 点赞
            </el-button>
            <el-button 
              text 
              :icon="post.isFavorited ? StarFilled : Star" 
              :type="post.isFavorited ? 'warning' : ''"  
              @click.stop="handleFavorite" 
              :loading="isFavoriting"
            >
              {{ post.favoritesCount || 0 }} 收藏
            </el-button>
          </div>
        </div>
      </div>

      <!-- *** ADD IMAGE DISPLAY HERE *** -->
      <div v-if="post.imageUrl" class="post-image-container">
        <el-image
          :src="resolveStaticAssetUrl(post.imageUrl)"
          :alt="post.title"
          fit="contain" 
          class="post-detail-image"
          lazy
          :preview-src-list="[resolveStaticAssetUrl(post.imageUrl)]"
          preview-teleported
          hide-on-click-modal
        />
      </div>
      <!-- *** END ADD IMAGE DISPLAY *** -->

      <!-- Post Body -->
      <div class="post-body" v-html="renderedContent"></div>

      <!-- Comments Section -->
      <div class="comments-section">
        <h2>评论 ({{ post?.commentsCount || 0 }})</h2> 
        
        <!-- Top-level Comment Input -->
        <div class="comment-input-area top-level-input">
          <el-avatar :size="32" :src="userStore.resolvedAvatarUrl" class="comment-avatar"/>
          <div class="input-wrapper">
             <el-input type="textarea" :rows="2" placeholder="添加评论..." v-model="newCommentText"></el-input>
             <el-button 
                type="primary" 
                @click="submitComment({ parentId: null, text: newCommentText })" 
                :disabled="!newCommentText.trim()" 
                :loading="isSubmittingComment && replyingToCommentId === null"
              >
                发表评论
              </el-button>
          </div>
        </div>

        <el-divider />

        <!-- Comment List (Manual Two-Level Rendering with Flattened Replies) -->
        <div class="comment-list">
            <div v-if="isCommentsLoading" class="comments-loading">
                <el-skeleton :rows="5" animated />
            </div>
            <el-alert v-else-if="commentsError" :title="commentsError" type="error" show-icon />
            <div v-else-if="nestedComments.length > 0">
                 <!-- Loop through top-level comments -->
                 <template v-for="topLevelComment in nestedComments" :key="topLevelComment.id">
                    <CommentItem
                        :comment="topLevelComment"
                        @toggle-reply="handleToggleReply"      
                        @submit-comment="submitComment"  
                        @delete-comment="deleteComment" 
                        :reply-to-author-name="null"  
                    />
                    <!-- Render ALL descendants flattened into the second level -->
                    <div 
                        v-if="topLevelComment.children && topLevelComment.children.length > 0" 
                        class="replies-container" 
                        style="margin-left: 40px;" > 
                        <!-- Use flattenDescendants to get all replies -->
                        <CommentItem
                            v-for="reply in flattenDescendants(topLevelComment)" 
                            :key="reply.id"
                            :comment="reply" 
                            :reply-to-author-name="reply.replyToAuthorName" 
                            @toggle-reply="handleToggleReply"
                            @submit-comment="submitComment"
                            @delete-comment="deleteComment"
                        />
                    </div>
                 </template>
            </div>
            <el-empty description="暂无评论，快来抢沙发吧！" v-else />
        </div>
      </div>

    </div>
    <el-empty description="帖子未找到" v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, provide } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElSkeleton, ElAlert, ElEmpty, ElAvatar, ElButton, ElInput, ElMessage, ElDivider } from 'element-plus';
import { Star, StarFilled, ChatLineSquare, Delete, Back } from '@element-plus/icons-vue';
import { PostService } from '@/services/PostService';
import { UserService } from '@/services/UserService';
import type { Post, Comment, User } from '@/types/models';
import MarkdownIt from 'markdown-it';
import { resolveStaticAssetUrl } from '@/utils/urlUtils';
import { useUserStore } from '@/stores/modules/user';
import CommentItem from '@/components/comments/CommentItem.vue';

// --- Initialize markdown-it ---
const md = new MarkdownIt();

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const postId = ref<number | null>(null);
const post = ref<Post | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// --- Comment State ---
const comments = ref<Comment[]>([]);
const isCommentsLoading = ref(false);
const commentsError = ref<string | null>(null);

// --- Action States ---
const isLiking = ref(false);
const isFavoriting = ref(false);
const isSubmittingComment = ref(false);
const newCommentText = ref('');

// --- Reply State ---
const replyingToCommentId = ref<number | null>(null);

// --- Follow Author State ---
const followAuthorLoading = ref(false);

// 使用 provide 提供状态
provide('replyingToCommentId', replyingToCommentId);

// --- Computed property for nested comments ---
interface NestedComment extends Comment {
    children?: NestedComment[];
}

const nestedComments = computed((): NestedComment[] => {
    const commentsMap: Record<number, NestedComment> = {};
    const rootComments: NestedComment[] = [];

    // Create a map of comments by their ID and add a children array
    (comments.value || []).forEach(comment => {
        commentsMap[comment.id] = { ...comment, children: [] };
    });

    // Build the nested structure
    (comments.value || []).forEach(comment => {
        const nestedComment = commentsMap[comment.id];
        if (comment.parentId && commentsMap[comment.parentId]) {
            // Ensure children array exists before pushing
            if (!commentsMap[comment.parentId].children) {
                commentsMap[comment.parentId].children = [];
            }
            // Prevent adding self as child if data is inconsistent
            if (commentsMap[comment.parentId].id !== nestedComment.id) {
                commentsMap[comment.parentId].children!.push(nestedComment);
            }
        } else if (nestedComment) { // Ensure nestedComment exists before pushing to root
            rootComments.push(nestedComment);
        }
    });

    // Sort comments and their children by creation date (optional)
    const sortComments = (list: NestedComment[]) => {
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        list.forEach(c => {
            if (c.children) sortComments(c.children);
        });
    };
    sortComments(rootComments);

    return rootComments;
});

// --- Helper function to flatten comment descendants ---
interface CommentWithReplyTo extends NestedComment {
    replyToAuthorName?: string | null;
}
const flattenDescendants = (comment: NestedComment): CommentWithReplyTo[] => {
    const flattened: CommentWithReplyTo[] = [];
    const processComment = (currentComment: NestedComment, replyToName: string | null) => {
        // Add the current reply with the name it's replying to
        flattened.push({ ...currentComment, replyToAuthorName: replyToName });
        // Recursively process its children
        if (currentComment.children && currentComment.children.length > 0) {
            currentComment.children.forEach(child => {
                // The child is replying to the currentComment's author
                processComment(child, currentComment.author?.name || null); 
            });
        }
    };

    // Start processing children of the top-level comment
    if (comment.children && comment.children.length > 0) {
        comment.children.forEach(child => {
            // These first-level replies are replying to the top-level comment's author
            processComment(child, comment.author?.name || null); 
        });
    }
    return flattened;
};

// --- Computed property for rendered Markdown content using markdown-it ---
const renderedContent = computed(() => {
  if (post.value?.content) {
    try {
      return md.render(post.value.content); // 使用 markdown-it 渲染
    } catch (e) {
      console.error("Error parsing markdown:", e);
      error.value = '内容解析错误'; // Set error state
      return '<p>内容解析错误</p>'; // Fallback content
    }
  }
  return ''; // Return empty string if no content
});

// --- Data Fetching ---
const fetchComments = async () => {
    if (!postId.value) return;
    isCommentsLoading.value = true;
    commentsError.value = null;
    try {
        // Ensure PostService.getCommentsByPostId returns an array or handle null/undefined
        const response = await PostService.getCommentsByPostId(postId.value);
        console.log('[PostDetailView] Raw comments response from API:', JSON.stringify(response, null, 2)); // Log the raw response
        comments.value = Array.isArray(response) ? response : []; 
    } catch (err: any) {
        console.error('Error fetching comments:', err);
        commentsError.value = err.response?.data?.message || '加载评论失败';
        comments.value = []; // Clear comments on error
    } finally {
        isCommentsLoading.value = false;
    }
};

const fetchPostDetails = async (id: number) => {
  if (!id) {
    error.value = '无效的帖子 ID';
    isLoading.value = false;
    return;
  }
  console.log(`[PostDetailView] fetchPostDetails started for ID: ${id}`);
  isLoading.value = true;
  error.value = null;
  post.value = null; // Reset post data
  try {
    // Add logging before API call
    console.log(`[PostDetailView] Calling PostService.getPostById(${id})...`);
    const response = await PostService.getPostById(id);
    // Add logging after API call
    console.log(`[PostDetailView] API Response received:`, response);
    post.value = response.post;
    // Trigger comment loading after post details are fetched
    await fetchComments();
  } catch (err: any) {
    console.error(`[PostDetailView] Error fetching post details for ID ${id}:`, err);
    error.value = err.response?.data?.message || '加载帖子详情失败';
    post.value = null;
  } finally {
    isLoading.value = false;
    console.log(`[PostDetailView] fetchPostDetails finished for ID: ${id}. Loading: ${isLoading.value}, Error: ${error.value}`);
  }
};

// --- Formatting ---
const formatTime = (isoString: string | undefined | Date): string => { // Accept Date object too
  if (!isoString) return '未知时间';
  try {
      const date = new Date(isoString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
          return '无效日期';
      }
      // Use a more detailed format for the post page
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  } catch (e) {
      console.error("Error formatting time:", e);
      return "时间格式错误";
  }
};

// --- Action Handlers ---
const handleLike = async () => {
  if (!post.value || !post.value.id) return; // Check post and post.id
  if (!userStore.isLoggedIn) return ElMessage.warning('请先登录');
  if (isLiking.value) return;
  isLiking.value = true;

  try {
    // Create a non-reactive copy to avoid potential direct mutation issues if needed
    // const currentPostData = { ...post.value }; 
    const postIdValue = post.value.id; // Store id in case post.value changes unexpectedly

    if (post.value.isLiked) {
      await PostService.unlikePost(postIdValue);
      // Update reactive state AFTER successful API call
      if (post.value && post.value.id === postIdValue) { // Check if post still exists and is the same one
        post.value.likesCount = Math.max(0, (post.value.likesCount ?? 1) - 1);
        post.value.isLiked = false;
      }
    } else {
      await PostService.likePost(postIdValue);
      // Update reactive state AFTER successful API call
      if (post.value && post.value.id === postIdValue) {
        post.value.likesCount = (post.value.likesCount ?? 0) + 1;
        post.value.isLiked = true;
      }
    }
    // No need for post.value = { ...currentPostData } unless backend returns the whole object
    // and you want to ensure full reactivity update. If backend only confirms success,
    // updating the specific fields is sufficient.
  } catch (err: any) {
     console.error("Like/Unlike error:", err);
     ElMessage.error(err.response?.data?.message || '点赞操作失败');
  } finally {
    isLiking.value = false;
  }
};

const handleFavorite = async () => {
  if (!post.value || !post.value.id) return;
  if (!userStore.isLoggedIn) return ElMessage.warning('请先登录');
  if (isFavoriting.value) return;
  isFavoriting.value = true;
  
  try {
    const postIdValue = post.value.id;

    if (post.value.isFavorited) {
      await PostService.unfavoritePost(postIdValue);
       if (post.value && post.value.id === postIdValue) {
         post.value.favoritesCount = Math.max(0, (post.value.favoritesCount ?? 1) - 1);
         post.value.isFavorited = false;
       }
    } else {
      await PostService.favoritePost(postIdValue);
      if (post.value && post.value.id === postIdValue) {
        post.value.favoritesCount = (post.value.favoritesCount ?? 0) + 1;
        post.value.isFavorited = true;
      }
    }
  } catch (err: any) {
     console.error("Favorite/Unfavorite error:", err);
     ElMessage.error(err.response?.data?.message || '收藏操作失败');
  } finally {
    isFavoriting.value = false;
  }
};

const submitComment = async (payload: { parentId: number | null; text: string }) => {
    if (!post.value || !post.value.id) return; // Check post and post.id
    const { parentId, text } = payload;

    const trimmedText = text ? text.trim() : ''; // Trim safely
    if (!trimmedText) {
        ElMessage.warning('评论内容不能为空');
        return;
    }
    if (!userStore.isLoggedIn) {
        ElMessage.warning('请先登录');
        return;
    }
    
    // Determine which loading state to use based on parentId ONLY
    const isLoadingTopLevel = parentId === null;
    
    // Prevent double submission
    if ((isLoadingTopLevel && isSubmittingComment.value) /* || (check specific reply loading state if implemented) */) {
        return;
    }

    if (isLoadingTopLevel) {
        isSubmittingComment.value = true; // Set loading state for top-level
    } else {
        // Handle reply loading state if needed (e.g., passed via event or managed in CommentItem)
    }

    try {
        const servicePayload: { text: string; parentId?: number } = {
            text: trimmedText,
        };
        if (parentId !== null) {
            servicePayload.parentId = parentId;
        }

        // Assuming createComment doesn't return the new comment or updated post
        await PostService.createComment(post.value.id, servicePayload);
        ElMessage.success(parentId ? '回复发表成功' : '评论发表成功');

        // Clear input and close reply box
        if (parentId !== null) {
            replyingToCommentId.value = null; // Close the reply input box globally
            // CommentItem should clear its own input via v-model or on successful emit
        } else {
            newCommentText.value = ''; // Clear top-level comment input
        }

        // Refresh comments AND potentially the post count from server
        // Option 1: Just fetch comments (if post count isn't critical or backend updates it reliably)
         await fetchComments(); 
        // Option 2: Fetch both post details and comments (safer for count)
        // await fetchPostDetails(); // This will also call fetchComments

        // Simple local count update (can be slightly off if fetch fails)
        if (post.value) {
             post.value.commentsCount = (post.value.commentsCount || 0) + 1;
        }

    } catch (err: any) {
        console.error("Error submitting comment/reply:", err);
        ElMessage.error(err.response?.data?.message || (parentId ? '回复发表失败' : '评论发表失败'));
    } finally {
         if (isLoadingTopLevel) {
             isSubmittingComment.value = false; // Reset loading state
         } else {
              // Reset reply loading state if needed
         }
    }
};

const handleToggleReply = (id: number | null) => { // Allow null to close all
  console.log('[PostDetailView] handleToggleReply called with id:', id);
  if (id === null) { // Explicitly handle closing all/clearing
      replyingToCommentId.value = null;
  } else if (replyingToCommentId.value === id) {
    replyingToCommentId.value = null; // Close if already open
  } else {
    replyingToCommentId.value = id; // Open for this comment
  }
  console.log('[PostDetailView] Current replyingToCommentId after change:', replyingToCommentId.value);
};

const deleteComment = async (id: number) => {
    if (!post.value || !post.value.id || !userStore.isLoggedIn) return;

    // Optional: Confirmation dialog here
    // ElMessageBox.confirm(...) 

    try {
        await PostService.deleteComment(id);
        ElMessage.success('评论删除成功');

        // Simplify: Remove complex local count calculation.
        // Rely on fetching fresh data from the server.

        // Refresh comments list from the server
        await fetchComments(); 
        
        // OPTIONAL: Fetch post details if comment count is crucial and needs server verification
        // await fetchPostDetails(); // This also refetches comments

        // Fallback local count decrement (less reliable)
        if(post.value && post.value.commentsCount) {
             post.value.commentsCount = Math.max(0, post.value.commentsCount - 1); 
             // Note: This doesn't account for deleted replies reducing the count more.
        }

    } catch (err: any) {
        console.error('Error deleting comment:', err);
        ElMessage.error(err.response?.data?.message || '评论删除失败');
    }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  console.log(`[PostDetailView] Component onMounted. Route params ID: ${route.params.id}`);
  const idFromRoute = Number(route.params.id);
  if (!isNaN(idFromRoute)) {
    postId.value = idFromRoute;
    fetchPostDetails(idFromRoute);
  } else {
    error.value = '无效的帖子 ID';
    isLoading.value = false;
    console.error('[PostDetailView] Invalid post ID in route on mount.');
  }
});

// Watch for route parameter changes
watch(() => route.params.id, (newId) => {
  console.log(`[PostDetailView] Watch triggered: route.params.id changed to ${newId}`);
  const numericId = Number(newId);
  if (newId && !isNaN(numericId) && numericId !== postId.value) {
    postId.value = numericId;
    console.log(`[PostDetailView] Watch: Calling fetchPostDetails for new ID: ${numericId}`);
    fetchPostDetails(numericId);
  } else if (newId && numericId === postId.value) {
    console.warn(`[PostDetailView] Watch: newId (${numericId}) is the same as current postId (${postId.value}), skipping fetch.`);
  } else if (!newId || isNaN(numericId)) {
    console.error(`[PostDetailView] Watch: Invalid newId received: ${newId}`);
    error.value = '无效的帖子 ID';
    isLoading.value = false;
    post.value = null;
    comments.value = [];
  }
});

// --- Navigation --- REMOVED DUPLICATE PLACEHOLDER
const goBack = () => {
  // Check if there's history to go back to, otherwise navigate to a default route (e.g., home)
  if (window.history.length > 1) {
     router.back(); 
  } else {
     router.push('/'); // Navigate to home or another default page
  }
};

// + Computed property to show follow button
const showFollowAuthorButton = computed(() => {
    return (
        userStore.isLoggedIn &&
        post.value?.author?.id &&
        userStore.currentUser?.id !== post.value.author.id
    );
});

// + Method to handle follow/unfollow button click
const handleFollowAuthor = async () => {
    if (!post.value?.author?.id || !showFollowAuthorButton.value) return;
    followAuthorLoading.value = true;
    const targetUserId = post.value.author.id;
    try {
        if (post.value.author.isFollowing) {
            await UserService.unfollowUser(targetUserId);
            if (post.value.author) post.value.author.isFollowing = false;
            // Optionally update follower count if the backend provides it here or refetch post
            ElMessage.success('已取消关注');
        } else {
            await UserService.followUser(targetUserId);
            if (post.value.author) post.value.author.isFollowing = true;
            // Optionally update follower count
            ElMessage.success('关注成功');
        }
    } catch (error: any) {
        console.error("Follow/Unfollow failed:", error);
        ElMessage.error('操作失败');
    } finally {
        followAuthorLoading.value = false;
    }
};

</script>

<style scoped lang="scss">
.post-detail-view {
  max-width: 800px; // Limit content width for readability
  margin: 20px auto; // Center the content
  padding: 25px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.loading-state, .el-alert, .el-empty {
  margin-top: 30px;
}

.post-header {
  margin-bottom: 30px;
  padding-bottom: 0; // Remove padding-bottom from header itself
  border-bottom: none; // Remove border from header itself

  h1 {
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 15px;
    color: #303133;
  }

  .meta-bar {
      display: flex;
      align-items: center;
      justify-content: space-between; // Distribute space
      margin-bottom: 20px;
      flex-wrap: wrap; // Allow wrapping on small screens
      gap: 10px;
  }

  .author-info {
    display: flex;
    align-items: center;
    gap: 8px; // Gap between avatar, text, button
    flex-grow: 1; // Allow author info to grow
    min-width: 150px; // Prevent excessive shrinking
  }

  .author-avatar {
    margin-right: 12px;
  }

  .info-text {
    display: flex;
    flex-direction: column;
  }

  .author-name-link {
    text-decoration: none;
    color: inherit;
    &:hover .author-name {
         color: var(--el-color-primary);
    }
  }

  .author-name {
    font-weight: 500;
    font-size: 0.95rem;
    color: var(--el-text-color-primary);
  }

  .publish-time {
    font-size: 0.8rem;
    color: var(--el-text-color-secondary);
  }

  // Styles for the inline actions
  .post-actions-inline {
      display: flex;
      align-items: center;
      gap: 15px;
      flex-shrink: 0; // Prevent shrinking

      .el-button {
          // Ensure text buttons align nicely
          padding: 0; // Remove default padding if using text buttons
      }
  }
}

.post-body {
  line-height: 1.8; 
  font-size: 1rem;
  color: #333;
  margin-bottom: 30px;
  
  /* Deep styles for rendered Markdown content */
  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin-top: 1.5em;
    margin-bottom: 0.8em;
    font-weight: 600;
    line-height: 1.4;
  }
  :deep(h1) { font-size: 1.8em; }
  :deep(h2) { font-size: 1.5em; border-bottom: 1px solid var(--el-border-color-lighter); padding-bottom: 0.3em; }
  :deep(h3) { font-size: 1.3em; }
  :deep(h4) { font-size: 1.1em; }

  :deep(p) { 
     margin-bottom: 1.2em;
     word-wrap: break-word; // Ensure long words wrap
  }
  
   :deep(ul),
   :deep(ol) {
     padding-left: 2em;
     margin-bottom: 1.2em;
   }
   :deep(li) {
       margin-bottom: 0.5em;
   }

   :deep(img) { 
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 1.5em 0;
      display: block; // Prevent extra space below image
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
   }
   
   :deep(blockquote) {
       margin: 1.5em 0;
       padding: 10px 15px;
       border-left: 4px solid var(--el-color-primary-light-3);
       background-color: var(--el-fill-color-light);
       color: #555;
       p {
           margin-bottom: 0; // Remove bottom margin for paragraphs inside blockquote
       }
   }
   
   :deep(pre) {
       margin: 1.5em 0;
       padding: 15px;
       background-color: #f5f7fa;
       border-radius: 4px;
       overflow-x: auto; // Enable horizontal scrolling for long code lines
       code {
           font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
           font-size: 0.9em;
           color: #333;
           background-color: transparent; // Override potential inner background
           padding: 0; // Override potential inner padding
       }
   }
   
   :deep(code) { // Inline code
       font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
       background-color: #f0f2f5;
       padding: 0.2em 0.4em;
       border-radius: 3px;
       font-size: 0.9em;
   }
   
   :deep(a) {
       color: var(--el-color-primary);
       text-decoration: none;
       &:hover {
           text-decoration: underline;
       }
   }
   
   :deep(hr) {
       border: none;
       border-top: 1px solid var(--el-border-color-lighter);
       margin: 2em 0;
   }
}

.comments-section {
  margin-top: 40px;

  h2 {
    font-size: 1.5rem;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .comment-input-area {
    margin-bottom: 30px;
    .el-textarea {
      margin-bottom: 10px;
    }
    div > .el-button {
        float: right;
        margin-top: 5px;
    }
  }

  .comment-list {
    margin-top: 20px;

    .comments-loading {
        padding: 20px 0;
    }
    .el-alert {
        margin-bottom: 15px;
    }

    .el-empty {
         padding: 30px 0;
     }
  }
}

.comment-input-area.top-level-input {
    display: flex;
    align-items: flex-start; // Align avatar top
    margin-bottom: 20px;
    .comment-avatar {
        margin-right: 15px;
        flex-shrink: 0;
    }
    .input-wrapper {
        flex-grow: 1;
        .el-textarea {
            margin-bottom: 10px;
        }
        .el-button {
            float: right;
        }
    }
}

// Style for the back button container
.back-button-container {
  margin-bottom: 15px; // Space below the back button
  padding-bottom: 10px; // Optional: Extra space
  // border-bottom: 1px solid var(--el-border-color-lighter); // Optional: Separator line
}

/* --- ADD STYLES FOR POST IMAGE --- */
.post-image-container {
  margin-bottom: 25px; // Space below image
  text-align: center; // Center image if needed
}

.post-detail-image {
  max-width: 100%; // Ensure image doesn't overflow
  max-height: 500px; // Limit max height (optional)
  border-radius: 6px;
  background-color: #f0f2f5; // Placeholder background
}
/* --- END ADD STYLES --- */

// + Style for the inline follow button
.follow-button-inline {
    margin-left: 12px; // Add some space from the author text
    padding: 4px 8px; // Make it smaller
    font-size: 0.75rem;
}
</style> 