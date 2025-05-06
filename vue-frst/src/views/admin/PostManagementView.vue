<template>
  <div class="post-management-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>帖子管理</span>
        </div>
      </template>

      <!-- 搜索和筛选区域 -->
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="搜索">
          <el-input v-model="filters.search" placeholder="标题/内容" clearable @keyup.enter="fetchPosts"></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="选择状态" clearable @change="fetchPosts">
            <el-option label="全部" value="ALL"></el-option>
            <el-option label="已发布" value="PUBLISHED"></el-option>
            <el-option label="待审核" value="PENDING_REVIEW"></el-option>
            <el-option label="已删除" value="ARCHIVED"></el-option>
            <el-option label="草稿" value="DRAFT"></el-option>
            <el-option label="已拒绝" value="REJECTED"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <!-- 修改查询按钮: 添加图标和加载状态 -->
          <el-button type="primary" @click="fetchPosts" :icon="Search" :loading="loading">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 帖子表格 -->
      <el-table :data="posts" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="title" label="标题" min-width="180">
          <template #default="{ row }">
            <el-link type="primary">{{ row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="author.username" label="作者" width="120">
             <template #default="{ row }">
                 {{ row.author?.username || '未知作者' }}
             </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ translateStatus(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
           <template #default="{ row }">
               {{ formatDateTime(row.createdAt) }}
           </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <!-- <el-button size="small" @click="/* 查看详情逻辑 */">查看</el-button> -->
            <!-- 修改删除按钮: 添加图标 -->
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(row)" 
              :disabled="row.status === 'ARCHIVED'"
              :icon="Delete"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        background
        layout="prev, pager, next, jumper, ->, total"
        :total="pagination.totalPosts"
        :page-size="pagination.limit"
        :current-page="pagination.currentPage"
        @current-change="handlePageChange"
        class="pagination-container"
      >
      </el-pagination>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
// --- 修改: 导入图标 ---
import { Search, Delete } from '@element-plus/icons-vue'; 
import { AdminService } from '@/services/AdminService';
import type { Post, PostStatus } from '@/types/models'; 
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs'; 

// --- State --- 
const posts = ref<Post[]>([]);
const loading = ref(false);
const pagination = reactive({
  currentPage: 1,
  limit: 10,
  totalPosts: 0,
  totalPages: 1
});
const filters = reactive({
  search: '',
  status: 'ALL' as PostStatus | 'ALL' | undefined 
});

// --- Methods --- 

// Fetch posts data from the API
const fetchPosts = async () => {
  loading.value = true;
  try {
    const response = await AdminService.getPosts({
      page: pagination.currentPage,
      limit: pagination.limit,
      search: filters.search || undefined, 
      status: (filters.status === 'ALL' || !filters.status) ? undefined : filters.status 
    });
    posts.value = response.posts;
    pagination.totalPosts = response.totalPosts;
    pagination.totalPages = response.totalPages;
  } catch (error) {
    console.error('Failed to fetch posts:', error);
  } finally {
    loading.value = false;
  }
};

// Handle page change from pagination component
const handlePageChange = (newPage: number) => {
  pagination.currentPage = newPage;
  fetchPosts();
};

// Handle delete button click
const handleDelete = (post: Post) => {
  ElMessageBox.confirm(
    `确定要删除帖子 "${post.title}" (ID: ${post.id})吗？此操作会将帖子状态标记为 ARCHIVED。`,
    '确认删除',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      loading.value = true; 
      try {
        await AdminService.deletePost(post.id);
        fetchPosts();
      } catch (error) {
      } finally {
           loading.value = false;
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除');
    });
};

// Helper function to format datetime
const formatDateTime = (dateString: string | Date | undefined) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// Helper function to translate status enum to Chinese
const translateStatus = (status: PostStatus | undefined): string => {
  if (!status) return '未知';
  switch (status) {
    case 'PUBLISHED': return '已发布';
    case 'PENDING_REVIEW': return '待审核';
    case 'ARCHIVED': return '已删除';
    case 'DRAFT': return '草稿';
    case 'REJECTED': return '已拒绝';
    default: return status;
  }
};

// Helper function to determine tag type based on status
const getStatusTagType = (status: PostStatus | undefined): 'success' | 'warning' | 'info' | 'danger' => {
  if (!status) return 'info';
  switch (status) {
    case 'PUBLISHED': return 'success';
    case 'PENDING_REVIEW': return 'warning';
    case 'ARCHIVED': return 'danger';
    case 'DRAFT': return 'info';
    case 'REJECTED': return 'danger';
    default: return 'info';
  }
};

// --- Lifecycle Hooks --- 
onMounted(() => {
  fetchPosts(); 
});
</script>

<style scoped>
.post-management-view {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-form {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* Optional: Add custom styles for tags */
</style>
