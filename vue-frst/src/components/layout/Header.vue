<template>
  <el-header class="header">
    <!-- Add inner container for content alignment -->
    <div class="header-content">
      <div class="logo" @click="goToHome">
        <!-- 稍后替换为真实 logo -->
        <!-- <img src="@/assets/images/logo.png" alt="美食分享 Logo" /> -->
        <span>美食分享</span>
      </div>
      <el-menu mode="horizontal" router :default-active="$route.path" class="nav-menu">
        <el-menu-item index="/">主页</el-menu-item>
        <el-menu-item index="/discover">发现美食</el-menu-item>
        <el-menu-item index="/community">美食社区</el-menu-item>
      </el-menu>
      <div class="user-section">
        <!-- 根据登录状态显示不同内容 -->
        <template v-if="!userStore.isLoggedIn">
          <el-button type="primary" @click="goToLogin">登录</el-button>
          <el-button @click="goToRegister">注册</el-button>
        </template>
        <template v-else>
           <!-- Notification Bell -->
           <el-badge :value="unreadCount > 0 ? unreadCount : ''" :max="99" class="notification-badge" @click="goToNotifications" is-dot>
               <el-icon :size="22" class="notification-icon"><Bell /></el-icon>
           </el-badge>

           <!-- Reverted to ElPopover triggered by click -->
           <el-popover
             placement="bottom-end"
             trigger="click"
             :width="256"
             :show-arrow="false"
             :offset="10"
           >
             <template #reference>
               <!-- Restore trigger with username and arrow -->
               <div class="user-menu-trigger flex items-center cursor-pointer">
                  <el-avatar :size="32" :src="userStore.resolvedAvatarUrl" /> 
                  <span class="username ml-2">{{ userStore.userName }}</span>
                  <el-icon class="el-icon--right ml-1"><ArrowDown /></el-icon> 
               </div>
             </template>
             <!-- Restore ProfileDropdown component -->
             <ProfileDropdown />
           </el-popover>
        </template>
      </div>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user' // 引入 User Store
import { ArrowDown, Bell } from '@element-plus/icons-vue'; // Re-add ArrowDown icon and Bell icon
import ProfileDropdown from '../common/ProfileDropdown.vue'; // 导入自定义下拉菜单组件
import { NotificationService } from '@/services/NotificationService'; // Import NotificationService
import { ElBadge, ElIcon } from 'element-plus'; // Import ElBadge, ElIcon

const router = useRouter()
const userStore = useUserStore() // 获取 Store 实例

const unreadCount = ref(0); // State for unread count

// Fetch unread count when component mounts and user is logged in
const fetchUnreadCount = async () => {
  if (!userStore.isLoggedIn) return;
  try {
    // Call service to get notifications, focusing on unread count
    // Optimization: Backend could provide a dedicated endpoint for just the count
    const response = await NotificationService.getNotifications({ limit: 1, unreadOnly: true }); 
    unreadCount.value = response.unreadCount ?? 0; 
    console.log('[Header] Unread notifications count:', unreadCount.value);
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    unreadCount.value = 0; // Reset on error
  }
};

// Function to navigate to notifications page
const goToNotifications = () => {
    router.push({ name: 'Notifications' }); // Assuming route name is 'Notifications'
    // Optionally reset count optimistically or refetch after navigation
    // unreadCount.value = 0; 
};

// --- Lifecycle and Watchers ---
onMounted(() => {
  fetchUnreadCount();
  // TODO: Implement polling or WebSocket updates for real-time count
});

// Watch for login/logout to refetch count
watch(() => userStore.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    fetchUnreadCount();
  } else {
    unreadCount.value = 0; // Clear count on logout
  }
});

const goToHome = () => {
  router.push('/')
}

const goToLogin = () => {
  router.push('/login')
}

const goToRegister = () => {
  router.push('/register')
}

</script>

<style scoped lang="scss">
.header {
  // Remove flex layout and padding from the main header element
  // display: flex;
  // align-items: center;
  // justify-content: space-between;
  // padding: 0 50px; 
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: #fff;
  height: 60px;
  width: 100%; // Ensure it spans full width
}

// New container for inner content
.header-content {
    max-width: 1200px; // Match main content max-width
    margin: 0 auto; // Center the content
    display: flex;
    align-items: center;
    height: 100%; // Occupy full header height
    padding: 0 20px; // Add horizontal padding inside the content area
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  img {
    height: 40px;
    margin-right: 10px;
  }
  span {
    font-size: 22px;
    font-weight: 600;
    color: var(--el-color-primary);
  }
}

.nav-menu {
  border-bottom: none; 
  flex-grow: 1; // Restore flex-grow to fill space
  margin: 0 40px; 
  height: 100%; // 确保菜单项垂直居中

  .el-menu-item {
    font-size: 16px;
    height: 100%;
    display: inline-flex; // 确保垂直居中
    align-items: center;
    border-bottom: 2px solid transparent; // 移除默认下划线，为激活状态准备
    &:hover {
      background-color: transparent; // 移除默认 hover 背景
      color: var(--el-color-primary);
    }
    &.is-active {
       border-bottom-color: var(--el-color-primary); // 激活时显示下划线
       color: var(--el-color-primary) !important; // 覆盖默认激活颜色
       background-color: transparent !important; // 覆盖默认激活背景
    }
  }
}

.user-section {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 20px; // Add gap between elements
}

// Restore user-menu-trigger styles if they were removed
.user-menu-trigger {
  color: var(--el-text-color-primary);
  outline: none;
  // Add back any necessary styles for layout
  display: flex;
  align-items: center;
  .username { margin-left: 8px; margin-right: 4px; } // Adjust spacing
  .el-icon--right { margin-left: auto; } // Push arrow right if needed
}

.notification-badge {
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 100%; // Align vertically
}

.notification-icon {
  color: var(--el-text-color-regular);
  transition: color 0.2s ease;
  &:hover {
      color: var(--el-color-primary);
  }
}

</style> 