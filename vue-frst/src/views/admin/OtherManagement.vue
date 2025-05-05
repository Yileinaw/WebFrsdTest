<template>
  <el-card shadow="never" class="management-card">
    <template #header>
      <div class="card-header">
        <span>系统信息与其他管理</span>
      </div>
    </template>

    <el-skeleton :rows="5" animated v-if="loading" />

    <el-descriptions
      v-if="!loading && systemInfo"
      title="后端系统信息"
      :column="2"
      border
      class="system-info-descriptions"
    >
      <el-descriptions-item label="Node.js 版本">{{ systemInfo.nodeVersion }}</el-descriptions-item>
      <el-descriptions-item label="操作系统平台">{{ systemInfo.platform }}</el-descriptions-item>
      <el-descriptions-item label="操作系统类型">{{ systemInfo.osType }}</el-descriptions-item>
      <el-descriptions-item label="操作系统版本">{{ systemInfo.osRelease }}</el-descriptions-item>
      <!-- 可以根据需要添加更多后端返回的信息 -->
    </el-descriptions>

    <el-divider v-if="!loading" />

    <div v-if="!loading" class="other-actions">
        <h4>其他操作</h4>
        <el-button type="warning" disabled>
            清除服务器缓存 (未实现)
        </el-button>
        <el-button type="info" disabled style="margin-left: 10px;">
            查看活动日志 (未实现)
        </el-button>
        <p class="placeholder-description">
            这些功能将在未来版本中实现。
        </p>
    </div>

  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { AdminService } from '@/services/AdminService';
import type { SystemInfoResponse } from '@/services/AdminService'; // Import the interface
import { ElCard, ElDescriptions, ElDescriptionsItem, ElSkeleton, ElButton, ElDivider, ElMessage } from 'element-plus';

const loading = ref(true);
const systemInfo = ref<SystemInfoResponse | null>(null);

const fetchSystemInfo = async () => {
  loading.value = true;
  try {
    systemInfo.value = await AdminService.getSystemInfo();
  } catch (error) {
    // ElMessage已经在Service层处理了，这里可以选择性地再处理或记录日志
    console.error('在组件中捕获获取系统信息错误:', error);
    // 可以在这里设置一个错误状态，让用户知道加载失败
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchSystemInfo();
});
</script>

<style scoped>
.management-card {
  margin: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.system-info-descriptions {
  margin-top: 20px;
}
.other-actions {
    margin-top: 30px;
    padding-top: 20px;
}
.other-actions h4 {
    margin-bottom: 15px;
    color: #606266;
}
.placeholder-description {
    margin-top: 10px;
    font-size: 0.9em;
    color: #909399;
}
</style>
