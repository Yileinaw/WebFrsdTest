<template>
  <div class="admin-layout">
    <el-container>
      <el-aside width="200px" class="admin-aside">
        <div class="admin-logo">
          <el-button type="primary" :icon="ArrowLeft" circle @click="goBack" title="返回主站" />
          <span>管理后台</span>
        </div>
        <el-menu
          default-active="/admin/food-management"
          class="admin-menu"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/admin/food-management">
            <el-icon><Picture /></el-icon>
            <span>美食图片管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/posts">
            <el-icon><Document /></el-icon>
            <span>帖子管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/tags">
            <el-icon><PriceTag /></el-icon>
            <span>标签管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/settings">
            <el-icon><Setting /></el-icon>
            <span>网站设置</span>
          </el-menu-item>
          <el-menu-item index="/admin/other">
            <el-icon><More /></el-icon>
            <span>其他</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="admin-main">
        <router-view /> <!-- This is where the child routes like FoodManagementView will be rendered -->
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ElContainer, ElAside, ElMain, ElMenu, ElMenuItem, ElIcon, ElButton } from 'element-plus';
import { Picture, User, ArrowLeft, Document, Setting, More, PriceTag } from '@element-plus/icons-vue'; // Import necessary icons and ArrowLeft
import { RouterView, useRouter } from 'vue-router';

const router = useRouter(); // Get router instance

const goBack = () => {
  router.push('/'); // Navigate to home page
};
</script>

<style scoped lang="scss">
.admin-layout {
  height: 100vh;
}

.el-container {
  height: 100%;
}

.admin-aside {
  background-color: #304156;
  border-right: none;
}

.admin-logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  background-color: #2b2f3a;
  display: flex;
  align-items: center;
  justify-content: center;
  .el-button {
    margin-right: 10px;
  }
}

.admin-menu {
  border-right: none;
  background-color: #304156;
  height: calc(100% - 60px); // Full height minus logo

  .el-menu-item {
    color: #bfcbd9;
    &:hover {
      background-color: #263445 !important;
    }
    &.is-active {
      color: #409EFF !important;
      background-color: #1f2d3d !important;
    }
  }
}

.admin-main {
  padding: 20px;
  background-color: #f0f2f5;
}
</style> 