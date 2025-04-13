<!-- vue-frst/src/components/common/ProfileDropdown.vue -->
<template>
  <!-- Use a plain div as the root container -->
  <div class="profile-dropdown-content">
    <!-- + Restore User Info Header -->
    <div class="profile-header">
      <el-avatar 
        :size="40" 
        :src="dropdownAvatarUrl"
        class="header-avatar"
       />
      <div class="header-user-info">
         <span class="header-username">{{ userStore.currentUser?.name || '用户' }}</span>
         <span class="header-email">{{ userStore.currentUser?.email }}</span>
      </div>
    </div>

    <!-- Stats -->
    <div class="flex justify-around p-2 text-center text-sm border-b">
      <router-link :to="{ name: 'UserProfile', params: { userId: userStore.currentUser?.id }, query: { tab: 'posts' } }" class="stat-item">
         <div>{{ userStore.currentUser?.postCount ?? 0 }}</div>
        <div class="text-xs">动态</div>
      </router-link>
      <router-link :to="{ name: 'UserProfile', params: { userId: userStore.currentUser?.id }, query: { tab: 'followers' } }" class="stat-item">
        <div>{{ userStore.currentUser?.followerCount ?? 0 }}</div>
        <div class="text-xs">粉丝</div>
      </router-link>
      <router-link :to="{ name: 'UserProfile', params: { userId: userStore.currentUser?.id }, query: { tab: 'following' } }" class="stat-item">
        <div>{{ userStore.currentUser?.followingCount ?? 0 }}</div>
        <div class="text-xs">关注</div>
      </router-link>
      <router-link :to="{ name: 'UserProfile', params: { userId: userStore.currentUser?.id }, query: { tab: 'favorites' } }" class="stat-item">
          <div>{{ userStore.currentUser?.favoritesCount ?? 0 }}</div>
          <div class="text-xs">收藏</div>
      </router-link>
    </div>

    <!-- Links -->
    <div class="link-group">
      <div @click="goToRoute({ name: 'UserProfile', params: { userId: userStore.currentUser?.id } })" class="dropdown-item">
        <span><el-icon><User /></el-icon> 个人中心</span>
        <el-icon class="arrow-right"><ArrowRight /></el-icon>
      </div>
      <div @click="goToRoute({ name: 'EditProfile' })" class="dropdown-item">
        <span><el-icon><Setting /></el-icon> 账号设置</span>
         <el-icon class="arrow-right"><ArrowRight /></el-icon>
      </div>
      <div v-if="userStore.isAdmin" @click="router.push('/admin')" class="dropdown-item">
         <span><el-icon><Platform /></el-icon> 管理后台</span>
         <el-icon class="arrow-right"><ArrowRight /></el-icon>
      </div>
      <!-- Add more links as needed -->
    </div>

    <el-divider class="custom-divider"/>

    <!-- Logout -->
    <div class="p-1">
       <el-link :underline="false" @click="handleLogout" class="logout-link">
           <el-icon><SwitchButton /></el-icon> 退出登录
       </el-link>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/modules/user';
import type { RouteLocationRaw, RouteLocationNamedRaw } from 'vue-router';
// Import necessary Element Plus icons
import { User, Setting, Platform, SwitchButton, ArrowRight } from '@element-plus/icons-vue';
import { computed } from 'vue';

const userStore = useUserStore();
const router = useRouter();

// Keep computed for avatar as it worked
const dropdownAvatarUrl = computed(() => userStore.resolvedAvatarUrl);

// Type guard to check if the route has params
function isRouteWithParams(route: RouteLocationRaw): route is RouteLocationNamedRaw {
  return typeof route === 'object' && route !== null && 'params' in route;
}

const handleLogout = async () => {
  try {
    await userStore.logout();
    router.push({ name: 'Login' });
  } catch (error) {
    console.error('退出登录失败:', error);
  }
};

// Helper function for navigation using the type guard
const goToRoute = (route: RouteLocationRaw) => {
  if (isRouteWithParams(route) && route.params && 'userId' in route.params && !route.params.userId) {
      console.warn('Cannot navigate: User ID is missing.');
      return;
  }
  router.push(route);
};

</script>

<style scoped lang="scss">
// Apply card-like styles to the new root div
.profile-dropdown-content {
  width: 256px;
  background-color: var(--el-bg-color-overlay); // Use overlay background color
  border-radius: var(--el-border-radius-base);
  // border: 1px solid var(--el-border-color-lighter); // Keep border or remove based on popover style
  overflow: hidden; // Prevent content overflow
}

// + Add styles for the restored profile header
.profile-header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter); // Add separator
}

.header-avatar {
  margin-right: 12px;
  flex-shrink: 0; // Prevent avatar from shrinking
}

.header-user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden; // Prevent text overflow
}

.header-username {
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; // Handle long usernames
}

.header-email {
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; // Handle long emails
}

.border-b {
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.items-center { align-items: center; }
.p-3 { padding: 12px; }
.p-4 { padding: 16px; }
.mr-2 { margin-right: 8px; }
.flex-shrink-0 { flex-shrink: 0; }
.overflow-hidden { overflow: hidden; }
.truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.text-sm { font-size: var(--el-font-size-base); }
.font-medium { font-weight: var(--el-font-weight-primary); }
.text-xs { font-size: var(--el-font-size-extra-small); }
.text-secondary { color: var(--el-text-color-secondary); }

.flex { display: flex; }
.justify-around { justify-content: space-around; }
.text-center { text-align: center; }
.p-2 { padding: 8px; }

.stat-item {
  color: var(--el-text-color-regular);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: var(--el-border-radius-small);
  transition: background-color 0.2s ease;

  &:hover {
    color: var(--el-color-primary);
    background-color: var(--el-fill-color-light);
  }
  div:first-child {
    // Restore original font weight and size
    font-weight: 500;
    font-size: var(--el-font-size-base); 
    margin-bottom: 0; // Remove added margin
  }
  div:last-child {
     color: var(--el-text-color-secondary);
  }
}

.link-group {
    padding: 4px 0; // Restore previous padding
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 16px;
  width: 100%;
  cursor: pointer;
  color: var(--el-text-color-regular);
  font-size: var(--el-font-size-base);
  transition: background-color 0.2s ease, color 0.2s ease;

  span {
      display: flex;
      align-items: center;
  }

  .el-icon {
      margin-right: 8px;
      color: var(--el-text-color-secondary);
      font-size: 16px;
      vertical-align: middle;
  }
  
  .arrow-right {
      margin-right: 0;
      font-size: 14px;
      color: var(--el-text-color-placeholder);
  }

  &:hover {
    background-color: var(--el-fill-color-light);
    color: var(--el-color-primary);
    .el-icon {
        color: var(--el-color-primary);
    }
    .arrow-right {
         color: var(--el-color-primary);
    }
  }
}

.custom-divider {
    margin: 4px 12px;
    border-color: var(--el-border-color-lighter);
}

.p-1 { padding: 4px; }
.logout-link {
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: flex-start;
    padding: 9px 16px;
    font-size: var(--el-font-size-base);
    color: var(--el-text-color-secondary);

    .el-icon {
        margin-right: 8px;
        color: var(--el-text-color-secondary);
    }

    &:hover {
        color: var(--el-color-danger);
        background-color: var(--el-color-danger-light-9);
         .el-icon {
            color: var(--el-color-danger);
        }
    }
}

</style> 