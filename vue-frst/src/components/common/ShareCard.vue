<template>
  <el-card :body-style="{ padding: '0px' }" class="share-card">
    
    <!-- Post Image (if available) -->
    <el-image 
        v-if="post.imageUrl" 
        :src="resolveStaticAssetUrl(post.imageUrl)" 
        fit="cover" 
        class="post-image"
        lazy
        @click="goToPostDetail"
    >
         <template #placeholder>
            <div class="image-slot">加载中...</div>
         </template>
         <template #error>
            <div class="image-slot">
                <el-icon><Picture /></el-icon>
            </div>
         </template>
    </el-image>

    <div class="card-content">
       <!-- Author Info -->
       <div class="author-info">
         <el-avatar :size="40" :src="resolveStaticAssetUrl(post.author?.avatarUrl)" @error="true">
              <img src="@/assets/images/default-food.png" />
         </el-avatar>
         <div class="author-details">
           <span class="author-name">{{ post.author?.name || '匿名用户' }}</span>
           <span class="post-time">{{ formatTimeAgo(post.createdAt) }}</span>
         </div>
       </div>

       <!-- Post Title and Content -->
       <div class="post-body">
         <h3 class="post-title" @click="goToPostDetail">{{ post.title }}</h3>
         <p class="post-text">{{ truncateText(post.content, 100) }}</p>
       </div>

       <!-- Actions (Like, Comment, Favorite) -->
       <div class="actions">
         <el-button 
            :type="post.isLiked ? 'primary' : ''" 
            :icon="Star" 
            text 
            bg 
            @click="toggleLike"
            :loading="isLiking"
         >
            {{ post.likesCount || 0 }} 点赞
         </el-button>
         <el-button :icon="ChatDotSquare" text bg @click="goToPostDetail">
            {{ post.commentsCount || 0 }} 评论
         </el-button>
         <el-button 
            :type="post.isFavorited ? 'warning' : ''" 
            :icon="CollectionTag" 
            text 
            bg 
            @click="toggleFavorite"
            :loading="isFavoriting"
         >
             {{ post.favoritesCount || 0 }} 收藏
         </el-button>
          <el-tooltip content="更多操作" placement="top">
             <el-button :icon="MoreFilled" text circle class="more-options" @click.stop="() => {}" />
          </el-tooltip>
       </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElCard, ElAvatar, ElButton, ElMessage, ElIcon, ElImage, ElTooltip } from 'element-plus'; // Added ElImage
import { Star, ChatDotSquare, CollectionTag, MoreFilled, Picture } from '@element-plus/icons-vue'; // Added Picture
import type { Post } from '@/types/models';
import { useUserStore } from '@/stores/modules/user';
import { PostService } from '@/services/PostService'; 
import { formatTimeAgo, truncateText } from '@/utils/formatters'; // Assuming you have these helpers
import { resolveStaticAssetUrl } from '@/utils/urlUtils'; // Import the new util

// ... (rest of the script setup remains largely the same)

interface Props {
  post: Post;
}
const props = defineProps<Props>();

const emit = defineEmits<{ (e: 'update:post', post: Post): void }>();

const router = useRouter();
const userStore = useUserStore();
const isLiking = ref(false);
const isFavoriting = ref(false);

const goToPostDetail = () => {
  router.push({ name: 'PostDetail', params: { id: props.post.id } });
};

// Toggle Like Functionality
const toggleLike = async () => {
    if (!userStore.isLoggedIn) {
        ElMessage.warning('请先登录');
        router.push('/login');
        return;
    }
    isLiking.value = true;
    try {
        if (props.post.isLiked) {
            await PostService.unlikePost(props.post.id);
        } else {
            await PostService.likePost(props.post.id);
        }

        // Fetch the updated post data from the backend
        const response = await PostService.getPostById(props.post.id);
        const updatedPostData = response.post; // Assuming getPostById returns { post: Post }
        
        // Emit the fully updated post data
        emit('update:post', { 
            ...props.post, // Keep existing fields not returned by getPostById if any
            isLiked: updatedPostData.isLiked, 
            likesCount: updatedPostData.likesCount 
        });

    } catch (error: any) {
        console.error("Toggle like error:", error);
        ElMessage.error(error.response?.data?.message || '操作失败');
        // No rollback needed as we fetch fresh data
    } finally {
        isLiking.value = false;
    }
};

// Toggle Favorite Functionality
const toggleFavorite = async () => {
    if (!userStore.isLoggedIn) {
        ElMessage.warning('请先登录');
        router.push('/login');
        return;
    }
    isFavoriting.value = true;
    try {
        if (props.post.isFavorited) {
             await PostService.unfavoritePost(props.post.id); 
        } else {
             await PostService.favoritePost(props.post.id);
        }

        // Fetch the updated post data from the backend
        const response = await PostService.getPostById(props.post.id);
        const updatedPostData = response.post;

        // Emit the fully updated post data
        emit('update:post', { 
             ...props.post,
             isFavorited: updatedPostData.isFavorited,
             favoritesCount: updatedPostData.favoritesCount
        });
        
    } catch (error: any) {
        console.error("Toggle favorite error:", error);
        ElMessage.error(error.response?.data?.message || '操作失败');
        // No rollback needed
    } finally {
        isFavoriting.value = false;
    }
};

</script>

<style scoped lang="scss">
.share-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
}

.post-image {
    width: 100%;
    height: 200px; /* Adjust height as needed */
    display: block; /* Remove extra space below image */
    background-color: #f0f2f5; /* Placeholder background */
    cursor: pointer; /* Add pointer cursor on hover */
}

.image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-size: 14px;
    .el-icon {
        font-size: 30px;
    }
}

.card-content {
  padding: 15px 20px;
}

.author-info {
  display: flex;
  align-items: center;
  margin-bottom: 15px;

  .el-avatar {
    margin-right: 12px;
    flex-shrink: 0;
     img { // Ensure fallback image displays correctly
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
  }

  .author-details {
    display: flex;
    flex-direction: column;
    line-height: 1.3;
    overflow: hidden; // Prevent long names from breaking layout

    .author-name {
      font-weight: 500;
      color: #303133;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .post-time {
      font-size: 0.8rem;
      color: #909399;
    }
  }
}

.post-body {
  margin-bottom: 15px;

  .post-title {
    font-size: 1.15rem;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
    cursor: pointer;
    &:hover {
      color: var(--el-color-primary);
    }
  }
  .post-text {
    font-size: 0.9rem;
    color: #606266;
    line-height: 1.5;
    // Style for truncated text if needed
  }
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 10px;
  margin-top: 15px;

  .el-button {
    padding: 8px 10px; // Adjust button padding if needed
  }
  .more-options {
     margin-left: auto; // Push more options button to the far right
  }
}
</style>