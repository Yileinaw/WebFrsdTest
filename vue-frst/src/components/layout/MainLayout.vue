<template>
  <el-container class="main-layout">
    <Header />
    <el-main class="main-content">
      <!-- Original structure with KeepAlive and Transition -->
      <!-- <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <KeepAlive :include="['HomeView', 'DiscoverView', 'CommunityView', 'MyPostsView', 'MyFavoritesView']">
            <component :is="Component" :key="$route.fullPath" />
          </KeepAlive>
        </Transition>
      </RouterView> -->

      <!-- Temporarily use plain RouterView -->
      <RouterView :key="$route.fullPath" />
    </el-main>
    <Footer v-if="!isAdminRoute" />
  </el-container>
</template>

<script setup lang="ts">
import Header from './Header.vue'
import Footer from './Footer.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isAdminRoute = computed(() => route.matched.some(record => record.meta.isAdmin))
</script>

<style scoped lang="scss">
.main-layout {
  min-height: 100vh; // 确保布局至少占满整个视口高度
  display: flex;
  flex-direction: column;
}

.main-content {
  flex-grow: 1; // 让主内容区域填充可用空间
  // Add max-width, centering, and padding for better layout on wide screens
  max-width: 1200px;
  width: 100%; // Ensure it takes full width up to max-width
  margin-left: auto;
  margin-right: auto;
  padding: 20px; // Add padding around the content area
}

/* Define transition styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease; /* Adjust timing as needed */
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 