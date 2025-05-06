<template>
  <el-card class="user-management-card">
    <template #header>
      <div class="card-header">
        <span>用户管理</span>
        <!-- 可以添加一个“新增用户”按钮 -->
        <!-- <el-button type="primary" :icon="Plus">新增用户</el-button> -->
      </div>
    </template>

    <!-- 搜索和筛选区域 -->
    <el-row :gutter="20" class="query-section">
      <el-col :span="8">
        <el-input
          v-model="searchQuery"
          placeholder="按用户名或邮箱搜索"
          clearable
          @keyup.enter="fetchUsers(1)"
          @clear="fetchUsers(1)"
        >
          <template #append>
            <el-button :icon="Search" @click="fetchUsers(1)"></el-button>
          </template>
        </el-input>
      </el-col>
      <el-col :span="6">
        <el-select
          v-model="selectedRole"
          placeholder="按角色筛选"
          clearable
          @change="fetchUsers(1)"
        >
          <el-option label="管理员 (ADMIN)" value="ADMIN"></el-option>
          <el-option label="普通用户 (USER)" value="USER"></el-option>
          <el-option label="版主 (MODERATOR)" value="MODERATOR"></el-option>
          <!-- 根据实际情况添加更多角色 -->
        </el-select>
      </el-col>
    </el-row>

    <!-- 用户表格 -->
    <el-table :data="users" v-loading="loading" style="width: 100%" stripe border>
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="username" label="用户名" sortable></el-table-column>
      <el-table-column prop="email" label="邮箱" sortable></el-table-column>
      <el-table-column prop="role" label="角色" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="getRoleTagType(row.role)" effect="light">
            {{ formatRole(row.role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="注册时间" sortable width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" align="center">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无用户数据"></el-empty>
      </template>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-if="totalUsers > 0"
      class="pagination-container"
      background
      layout="prev, pager, next, jumper, ->, total, sizes"
      :total="totalUsers"
      :page-size="pageSize"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50, 100]"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
    </el-pagination>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElTable, ElTableColumn, ElPagination, ElButton, ElInput, ElSelect, ElOption, ElCard, ElRow, ElCol, ElTag, ElMessage, ElMessageBox, ElEmpty } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue'; // 引入 Plus 图标
import dayjs from 'dayjs';
import { AdminService } from '@/services/AdminService';
import type { Role } from '@/types/models'; // Import Role type

interface User {
  id: number;
  username: string | null;
  email: string;
  role: string;
  createdAt: string;
  // 可以根据需要添加更多字段
}

const users = ref<User[]>([]);
const totalUsers = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchQuery = ref('');
const selectedRole = ref<Role | ''>(''); // Update type definition
const loading = ref(false);

// 获取用户列表
const fetchUsers = async (page = currentPage.value) => {
  loading.value = true;
  currentPage.value = page;
  try {
    const params: { page: number; pageSize: number; search?: string; role?: Role | '' } = {
      page: currentPage.value,
      pageSize: pageSize.value,
    };
    if (searchQuery.value) {
      params.search = searchQuery.value;
    }
    if (selectedRole.value) { // 修改点2: 只有当 selectedRole.value 不为空字符串时，才传递 role
      params.role = selectedRole.value;
    }

    const response = await AdminService.getUsers(params);
    if (response && response.users) {
      users.value = response.users;
      totalUsers.value = response.total;
    } else {
      users.value = [];
      totalUsers.value = 0;
      ElMessage.warning('未能获取用户数据');
    }
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    users.value = [];
    totalUsers.value = 0;
    ElMessage.error(error.response?.data?.message || '获取用户列表失败，请检查网络或联系管理员');
  } finally {
    loading.value = false;
  }
};

// 处理分页大小改变
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  fetchUsers(1); // 页大小改变后，通常回到第一页
};

// 处理当前页改变
const handleCurrentChange = (newPage: number) => {
  fetchUsers(newPage);
};

// 格式化日期时间
const formatDateTime = (dateTime: string | Date) => {
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss');
};

// 根据角色获取 Tag 类型
const getRoleTagType = (role: string): 'success' | 'warning' | 'info' | 'danger' => {
  switch (role) {
    case 'ADMIN': return 'success';
    case 'MODERATOR': return 'warning';
    case 'USER': return 'success';
    default: return 'info'; // Changed from '' to 'info'
  }
};

// 格式化角色显示名称 (中文)
const formatRole = (role: string): string => {
   switch (role) {
    case 'ADMIN': return '管理员';
    case 'MODERATOR': return '版主';
    case 'USER': return '用户';
    default: return role || '未知'; // 保留原始值以防万一
  }
}

// 处理编辑用户 (需要实现具体逻辑)
const handleEdit = (user: User) => {
  console.log('编辑用户:', user);
  ElMessage.info(`触发编辑用户: ${user.username || user.email}`);
  // 这里需要跳转到编辑页面或打开编辑对话框
};

// 处理删除用户
const handleDelete = (user: User) => {
  ElMessageBox.confirm(
    `确定要删除用户 “${user.username || user.email}” 吗？此操作不可恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
  .then(async () => {
    try {
      loading.value = true; // 可以添加局部加载状态
      // 调用删除用户的 API (需要 AdminService 中实现 deleteUser 方法)
      // await AdminService.deleteUser(user.id);
      ElMessage.success('用户删除成功');
      // 删除成功后刷新列表
      fetchUsers();
    } catch (error: any) {
      console.error('删除用户失败:', error);
      ElMessage.error(error.response?.data?.message || '删除用户失败');
    } finally {
        loading.value = false;
    }
  })
  .catch(() => {
    ElMessage.info('取消删除');
  });
};

// 组件挂载后获取初始数据
onMounted(() => {
  fetchUsers();
});

</script>

<style scoped>
.user-management-card {
  margin: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.query-section {
  margin-bottom: 20px; /* 在搜索区域和表格之间增加间距 */
}

.pagination-container {
  margin-top: 20px; /* 在表格和分页之间增加间距 */
  display: flex;
  justify-content: flex-end; /* 分页靠右显示 */
}

/* 可以根据需要添加更多自定义样式 */
</style>
