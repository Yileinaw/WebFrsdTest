<template>
  <div class="enhanced-share-card" :class="{ 'has-image': !!post.imageUrl, 'is-featured': isFeatured }">
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
          <div class="image-placeholder">加载中...</div>
        </template>
        <template #error>
          <div class="image-placeholder">
            <el-icon><Picture /></el-icon>
          </div>
        </template>
      </el-image>
      
      <!-- 悬浮在封面上的标签 -->
      <div class="floating-tags" v-if="post.tags && post.tags.length">
        <el-tag size="small" v-for="tag in post.tags.slice(0, 2)" :key="tag.id" type="info" class="tag-item">
          {{ tag.name }}
        </el-tag>
        <span v-if="post.tags.length > 2" class="more-tags">+{{ post.tags.length - 2 }}</span>
      </div>
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
import { defineProps, defineEmits, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElAvatar, ElButton, ElImage, ElTag, ElIcon, ElMessage, ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus';
import { Star, ChatDotSquare, CollectionTag, MoreFilled, Picture, Share } from '@element-plus/icons-vue';
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
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
  
  &.has-image {
    display: flex;
    flex-direction: column;
  }
  
  &.is-featured {
    border: 2px solid #ff9800;
    
    .card-cover {
      height: 280px;
    }
    
    .post-title {
      font-size: 1.4rem;
    }
  }
  
  .card-cover {
    position: relative;
    height: 220px;
    overflow: hidden;
    
    .cover-image {
      width: 100%;
      height: 100%;
      transition: transform 0.5s ease;
    }
    
    &:hover .cover-image {
      transform: scale(1.05);
    }
    
    .image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f7fa;
      color: #909399;
      
      .el-icon {
        font-size: 32px;
      }
    }
    
    .floating-tags {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      gap: 8px;
      z-index: 1;
      
      .tag-item {
        background-color: rgba(0, 0, 0, 0.6);
        color: #fff;
        border: none;
      }
      
      .more-tags {
        background-color: rgba(0, 0, 0, 0.6);
        color: #fff;
        padding: 0 8px;
        border-radius: 12px;
        font-size: 12px;
        line-height: 20px;
      }
    }
  }
  
  .card-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    .author-info {
      display: flex;
      align-items: center;
      gap: 10px;
      
      .author-avatar {
        cursor: pointer;
        border: 2px solid transparent;
        transition: border-color 0.3s;
        
        &:hover {
          border-color: var(--el-color-primary);
        }
      }
      
      .author-details {
        display: flex;
        flex-direction: column;
        
        .author-name {
          font-weight: 600;
          color: #303133;
          cursor: pointer;
          
          &:hover {
            color: var(--el-color-primary);
          }
        }
        
        .post-time {
          font-size: 12px;
          color: #909399;
        }
      }
    }
    
    .post-body {
      .post-title {
        margin: 0 0 8px;
        font-size: 1.2rem;
        font-weight: 600;
        color: #303133;
        cursor: pointer;
        
        &:hover {
          color: var(--el-color-primary);
        }
      }
      
      .post-text {
        margin: 0;
        font-size: 14px;
        color: #606266;
        line-height: 1.6;
        cursor: pointer;
      }
    }
    
    .post-stats {
      display: flex;
      align-items: center;
      margin-top: 8px;
      
      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-right: 20px;
        padding: 6px 10px;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.2s;
        
        &:hover {
          background-color: #f5f7fa;
        }
        
        &.is-active {
          color: var(--el-color-primary);
        }
        
        .el-icon {
          font-size: 16px;
        }
        
        span {
          font-size: 14px;
        }
      }
      
      .more-actions {
        margin-left: auto;
        
        .more-btn {
          padding: 6px;
          border-radius: 50%;
          
          &:hover {
            background-color: #f5f7fa;
          }
          
          .el-icon {
            font-size: 16px;
          }
        }
      }
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .enhanced-share-card {
    .card-cover {
      height: 180px;
    }
    
    &.is-featured .card-cover {
      height: 220px;
    }
    
    .card-content {
      padding: 12px;
      
      .post-body .post-title {
        font-size: 1.1rem;
      }
      
      .post-stats .stat-item {
        margin-right: 12px;
        padding: 4px 8px;
      }
    }
  }
}
</style>
