<template>
  <el-card class="post-card" shadow="hover" :body-style="{ padding: '0px' }" @click="handleCardClick">
    <!-- Image Section Container -->
    <div class="post-image-container">
      <el-image
        v-if="post.imageUrl"
        :src="resolvedImageUrl"
        fit="cover"
        class="post-image"
        lazy
      >
        <template #placeholder>
          <div class="image-slot loading">加载中...</div>
        </template>
        <template #error>
          <div class="image-slot error">
            <el-icon><Picture /></el-icon>
          </div>
        </template>
      </el-image>
      <!-- Placeholder for posts without image -->
      <div v-else class="image-slot placeholder">
        <el-icon><Document /></el-icon>
      </div>
    </div>

    <!-- Content Section -->
    <div class="post-details">
      <div class="post-header">
         <el-avatar :size="30" :src="resolvedAuthorAvatarUrl" />
         <span class="author-name">{{ post.author?.name || '匿名用户' }}</span>
         <span class="post-date">{{ formattedDate }}</span>
      </div>
       <div class="post-content">
         <p class="post-title">{{ post.title || '无标题' }}</p>
         <p class="content-preview">{{ post.content ? post.content.substring(0, 80) + '...' : '无内容' }}</p>
       </div>
       <div class="post-footer" @click.stop>
         <span class="stat-item" @click.stop>
           <el-icon><Pointer /></el-icon>
           {{ post.likesCount || 0 }}
         </span>
         <span class="stat-item" @click.stop>
           <el-icon><ChatDotRound /></el-icon>
           {{ post.commentsCount || 0 }}
         </span>
         <span class="stat-item" @click.stop>
           <el-icon><Star /></el-icon>
           {{ post.favoritesCount || 0 }}
         </span>
         <span class="spacer"></span>
         <template v-if="isAuthor">
           <el-button link type="primary" size="small" @click.stop="emit('edit', post.id)" class="action-button">
             <el-icon><Edit /></el-icon> 编辑
           </el-button>
           <el-button link type="danger" size="small" @click.stop="emit('delete', post.id)" class="action-button">
             <el-icon><Delete /></el-icon> 删除
           </el-button>
         </template>
         <el-icon class="more-icon" @click.stop><MoreFilled /></el-icon>
       </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import { ElCard, ElAvatar, ElIcon, ElImage, ElButton } from 'element-plus';
import { Pointer, ChatDotRound, Star, MoreFilled, Picture, Edit, Delete, Document } from '@element-plus/icons-vue';
import type { Post } from '@/types/models';
import { resolveStaticAssetUrl } from '@/utils/urlUtils';

const props = defineProps({
  post: {
    type: Object as PropType<Post>,
    required: true
  },
  isAuthor: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['card-click', 'edit', 'delete']);

const handleCardClick = () => {
  console.log(`[PostCard] handleCardClick triggered for post ID: ${props.post.id}`);
  emit('card-click', props.post.id);
};

const resolvedImageUrl = computed(() => resolveStaticAssetUrl(props.post.imageUrl));
const resolvedAuthorAvatarUrl = computed(() => resolveStaticAssetUrl(props.post.author?.avatarUrl));

const formattedDate = computed(() => {
  if (!props.post?.createdAt) return '';
   const date = new Date(props.post.createdAt);
   const now = new Date();
   const diffTime = Math.abs(now.getTime() - date.getTime());
   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

   if (diffDays < 1) return '今天';
   if (diffDays < 7) return `${diffDays}天前`;
   return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
});
</script>

<style scoped lang="scss">
.post-card {
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.post-image-container {
  width: 100%;
  height: 180px;
  background-color: var(--el-fill-color-lighter);
}

.post-image {
  width: 100%;
  height: 100%;
  display: block;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  background-color: inherit;

  .el-icon {
    font-size: 40px;
    color: var(--el-text-color-placeholder);
  }

  
 
 
}

.post-details {
  padding: 15px;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;

  .author-name {
    margin-left: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
  .post-date {
    margin-left: auto;
    font-size: 0.8rem;
    color: var(--el-text-color-secondary);
  }
}

.post-content {
  margin-bottom: 15px;
  .post-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 5px 0;
      color: var(--el-text-color-primary);
       overflow: hidden;
       text-overflow: ellipsis;
       white-space: nowrap;
  }
  .content-preview {
    font-size: 0.9rem;
    color: var(--el-text-color-regular);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: calc(0.9rem * 1.5 * 2);
  }
}

.post-footer {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);

  .stat-item {
    display: inline-flex;
    align-items: center;
    margin-right: 15px;
    .el-icon {
      margin-right: 4px;
      font-size: 14px;
    }
  }
  .spacer {
      flex-grow: 1;
  }
  .action-button {
    margin-left: 10px;
    font-size: 0.85rem;
    .el-icon {
        margin-right: 3px;
    }
  }
  .more-icon {
      cursor: pointer;
      &:hover {
          color: var(--el-color-primary);
      }
  }
}
</style> 