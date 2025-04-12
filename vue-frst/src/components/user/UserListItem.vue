<template>
  <div class="user-list-item">
    <router-link :to="{ name: 'UserProfile', params: { userId: user.id } }" class="user-info-link">
      <el-avatar :size="40" :src="resolvedAvatarUrl" class="user-avatar" />
      <div class="user-details">
        <span class="user-name">{{ user.name || user.username || '用户' + user.id }}</span>
        <span v-if="user.bio" class="user-bio">{{ user.bio }}</span>
      </div>
    </router-link>
    <div class="user-actions">
      <!-- Placeholder for Follow/Unfollow Button -->
      <!-- We'll add the button logic later when integrating with UserProfileView -->
      <!-- Example:
      <el-button
        v-if="showFollowButton"
        size="small"
        :type="isFollowing ? 'default' : 'primary'"
        :loading="isLoading"
        @click.stop="emit('toggle-follow', user.id)"
      >
        {{ isFollowing ? '已关注' : '关注' }}
      </el-button>
      -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import { ElAvatar, ElButton } from 'element-plus';
import { RouterLink } from 'vue-router';
import { resolveStaticAssetUrl } from '@/utils/urlUtils'; // Assuming you have this utility
import type { UserPublicListData } from '@/services/UserService';

const props = defineProps({
  user: {
    type: Object as PropType<UserPublicListData>,
    required: true
  },
  showFollowButton: { type: Boolean, default: false },
  isFollowing: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
});

// Define emits for actions
const emit = defineEmits(['toggle-follow']);

const resolvedAvatarUrl = computed(() => resolveStaticAssetUrl(props.user.avatarUrl));

</script>

<style scoped lang="scss">
.user-list-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--el-fill-color-lighter);
  }
}

.user-info-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
  flex-grow: 1; // Allow link to take available space
  margin-right: 15px; // Space before actions
}

.user-avatar {
  margin-right: 12px;
  flex-shrink: 0; // Prevent avatar shrinking
}

.user-details {
  display: flex;
  flex-direction: column;
  overflow: hidden; // Prevent text overflow issues
}

.user-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-bio {
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-actions {
  flex-shrink: 0; // Prevent actions area from shrinking
}
</style> 