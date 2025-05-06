<template>
  <div class="enhanced-share-card" :class="{ 'has-image': !!post.imageUrl, 'is-featured': isFeatured }" @click="goToPostDetail">
    <!-- 封面图区域 -->
    <div class="card-cover" v-if="post.imageUrl">
      <el-image
        :src="resolveStaticAssetUrl(post.imageUrl)"
        fit="cover"
        class="cover-image"
        lazy
        @click="goToPostDetail"
      >
        <template #placeholder>
          <div class="image-placeholder">
            <el-icon :size="30"><Picture /></el-icon>
          </div>
        </template>
        <template #error>
          <div class="image-placeholder">
            <el-icon :size="30"><Picture /></el-icon> <span>加载失败</span>
          </div>
        </template>
      </el-image>
    </div>
    
    <!-- 内容区域 -->
    <div class="card-content">
      <!-- 作者信息 -->
      <div class="author-info">
        <el-avatar 
          :size="32" 
          :src="resolveStaticAssetUrl(post.author?.avatarUrl || '')" 
          @error="true"
          @click="goToUserProfile"
          class="author-avatar"
        >
          <img src="@/assets/images/default-food.png" />
        </el-avatar>
        <div class="author-details">
          <span class="author-name" @click="goToUserProfile">{{ post.author?.name || '匿名用户' }}</span>
          <span class="post-time">{{ formatTimeAgo(post.createdAt) }}</span>
        </div>
      </div>
      
      <!-- 帖子标题和内容 -->
      <div class="post-body">
        <h3 class="post-title" @click="goToPostDetail">{{ post.title }}</h3>
        <p class="post-text" v-if="post.content" @click="goToPostDetail">{{ truncateText(post.content, 120) }}</p>
      </div>
      
      <!-- 新增的标签区域 -->
      <div class="post-tags" v-if="post.tags && post.tags.length">
        <el-tag size="small" v-for="tag in post.tags.slice(0, 3)" :key="tag.id" type="info" class="tag-item">
          {{ tag.name }}
        </el-tag>
        <span v-if="post.tags.length > 3" class="more-tags">+{{ post.tags.length - 3 }}</span>
      </div>
      
      <!-- 互动数据统计 -->
      <div class="post-stats">
        <div class="stat-item" :class="{ 'is-active': post.isLiked }" @click="toggleLike">
          <el-icon><Star /></el-icon>
          <span>{{ post.likesCount || 0 }}</span>
        </div>
        <div class="stat-item" @click="goToPostDetail">
          <el-icon><ChatDotSquare /></el-icon>
          <span>{{ post.commentsCount || 0 }}</span>
        </div>
        <div class="stat-item" :class="{ 'is-active': post.isFavorited }" @click="toggleFavorite">
          <el-icon><CollectionTag /></el-icon>
          <span>{{ post.favoritesCount || 0 }}</span>
        </div>
        
        <!-- 更多操作按钮 -->
        <el-dropdown trigger="click" class="more-actions" @command="handleCommand">
          <el-button type="text" class="more-btn">
            <el-icon><MoreFilled /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="share">分享</el-dropdown-item>
              <el-dropdown-item command="report" divided>举报</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElAvatar, ElButton, ElImage, ElTag, ElIcon, ElMessage, ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus';
import { Star, ChatDotSquare, CollectionTag, MoreFilled, Picture } from '@element-plus/icons-vue';
import type { Post, PostPreview } from '@/types/models';
import { useUserStore } from '@/stores/modules/user';
import { PostService } from '@/services/PostService';
import { formatTimeAgo, truncateText } from '@/utils/formatters';
import { resolveStaticAssetUrl } from '@/utils/urlUtils';

interface Props {
  post: PostPreview;
  isFeatured?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'like', id: number): void;
  (e: 'comment', id: number): void;
  (e: 'favorite', id: number): void;
  (e: 'update:post', post: Post): void;
}>();

const router = useRouter();
const userStore = useUserStore();
const isLiking = ref(false);
const isFavoriting = ref(false);

// 导航到帖子详情页
const goToPostDetail = () => {
  router.push({ name: 'PostDetail', params: { id: props.post.id } });
};

// 导航到用户个人页
const goToUserProfile = () => {
  if (props.post.author?.id) {
    router.push({ name: 'UserProfile', params: { id: props.post.author.id } });
  }
};

// 处理点赞
const toggleLike = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录再点赞');
    return;
  }
  
  if (isLiking.value) return;
  isLiking.value = true;
  
  try {
    const currentIsLiked = props.post.isLiked || false;
    const currentLikesCount = props.post.likesCount || 0;
    
    // 乐观更新UI
    const updatedPost = { 
      ...props.post, 
      isLiked: !currentIsLiked,
      likesCount: currentIsLiked ? Math.max(0, currentLikesCount - 1) : currentLikesCount + 1
    };
    
    emit('update:post', updatedPost as Post);
    
    // 调用API
    if (currentIsLiked) {
      await PostService.unlikePost(props.post.id);
    } else {
      await PostService.likePost(props.post.id);
    }
    
    emit('like', props.post.id);
  } catch (error: any) {
    console.error("Toggle like error:", error);
    ElMessage.error(error.response?.data?.message || '操作失败');
    
    // 回滚UI状态
    const rollbackPost = { 
      ...props.post,
      isLiked: props.post.isLiked || false,
      likesCount: props.post.likesCount || 0
    };
    
    emit('update:post', rollbackPost as Post);
  } finally {
    isLiking.value = false;
  }
};

// 处理收藏
const toggleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录再收藏');
    return;
  }
  
  if (isFavoriting.value) return;
  isFavoriting.value = true;
  
  try {
    const currentIsFavorited = props.post.isFavorited || false;
    const currentFavoritesCount = props.post.favoritesCount || 0;
    
    // 乐观更新UI
    const updatedPost = { 
      ...props.post, 
      isFavorited: !currentIsFavorited,
      favoritesCount: currentIsFavorited ? Math.max(0, currentFavoritesCount - 1) : currentFavoritesCount + 1
    };
    
    emit('update:post', updatedPost as Post);
    
    // 调用API
    if (currentIsFavorited) {
      await PostService.unfavoritePost(props.post.id);
    } else {
      await PostService.favoritePost(props.post.id);
    }
    
    emit('favorite', props.post.id);
  } catch (error: any) {
    console.error("Toggle favorite error:", error);
    ElMessage.error(error.response?.data?.message || '操作失败');
    
    // 回滚UI状态
    const rollbackPost = { 
      ...props.post,
      isFavorited: props.post.isFavorited || false,
      favoritesCount: props.post.favoritesCount || 0
    };
    
    emit('update:post', rollbackPost as Post);
  } finally {
    isFavoriting.value = false;
  }
};

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  switch (command) {
    case 'share':
      // 实现分享功能
      ElMessage.info('分享功能开发中...');
      break;
    case 'report':
      // 实现举报功能
      ElMessage.info('举报功能开发中...');
      break;
  }
};
</script>

<style scoped lang="scss">
.enhanced-share-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #fff; 
  border-radius: 12px;   
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.05); 
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden; 
  margin-bottom: 20px; 

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.07); 
  }

  &.has-image {
    // Specific styles if needed when an image is present
  }

  &.is-featured {
    // Example: Potentially larger shadow or different border
    // box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.08);
  }
}

.card-cover {
  width: 100%;
  max-height: 250px; 
  overflow: hidden;
  border-top-left-radius: 12px; 
  border-top-right-radius: 12px; 
  cursor: pointer; 

  .cover-image {
    width: 100%;
    height: 100%; 
    object-fit: cover;
    display: block; 

    .image-placeholder {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background-color: #f0f0f0; 
      color: #ccc;
      font-size: 1rem;
    }
  }
}

.card-content {
  padding: 15px 20px; 
  flex-grow: 1; 
  display: flex;
  flex-direction: column;
}

.author-info {
  display: flex;
  align-items: center;
  margin-bottom: 12px;

  .author-avatar {
    cursor: pointer;
    margin-right: 10px;
    flex-shrink: 0;
  }

  .author-details {
    display: flex;
    flex-direction: column;
    font-size: 0.8rem;
    .author-name {
      font-weight: 600;
      color: var(--el-text-color-primary);
      cursor: pointer;
      &:hover {
        text-decoration: underline;
      }
    }
    .post-time {
      color: var(--el-text-color-secondary);
    }
  }
}

.post-body {
  margin-bottom: 12px;
  flex-grow: 1; 

  .post-title {
    font-size: 1.1rem; 
    font-weight: 600;
    margin: 0 0 8px 0;
    color: var(--el-text-color-primary);
    cursor: pointer;
    line-height: 1.4;
    // For multi-line ellipsis (if desired, more complex CSS needed)
    display: -webkit-box;
    -webkit-line-clamp: 2; 
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  .post-text {
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--el-text-color-regular);
    margin: 0;
    // For multi-line ellipsis
    display: -webkit-box;
    -webkit-line-clamp: 3; 
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.post-tags {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .tag-item {
    cursor: default; 
  }
  .more-tags {
    font-size: 0.75rem;
    color: var(--el-text-color-secondary);
    align-self: center;
  }
}

.post-stats {
  display: flex;
  align-items: center;
  justify-content: space-between; 
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: auto; 

  .stat-item {
    display: flex;
    align-items: center;
    color: var(--el-text-color-secondary);
    font-size: 0.85rem;
    cursor: pointer;
    transition: color 0.2s ease;

    .el-icon {
      margin-right: 5px;
      font-size: 1.1rem;
    }

    &:hover,
    &.is-active {
      color: var(--el-color-primary);
    }
    // Prevent interaction if liking/favoriting is in progress (optional)
    // &.is-loading {
    //   pointer-events: none;
    //   opacity: 0.7;
    // }
  }

  .more-actions {
    .more-btn {
      color: var(--el-text-color-secondary);
      padding: 0; 
      min-height: auto;
      &:hover {
        color: var(--el-color-primary);
      }
    }
    .el-icon {
      font-size: 1.2rem;
    }
  }
}

// Ensure ElDropdown menu items are styled nicely if not already globally
.el-dropdown-menu__item {
  font-size: 0.9rem;
  i, .el-icon {
    margin-right: 8px;
  }
}
</style>
