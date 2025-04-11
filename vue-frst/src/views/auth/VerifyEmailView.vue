<template>
  <div class="verify-email-container">
    <el-card class="verify-card">
      <template #header>
        <div class="card-header">
          <h2>邮箱验证</h2>
        </div>
      </template>
      <div v-if="isLoading" class="status-section">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
        <p>正在验证您的邮箱，请稍候...</p>
      </div>
      <div v-else-if="verificationStatus === 'success'" class="status-section success">
        <el-icon color="var(--el-color-success)" :size="24"><CircleCheckFilled /></el-icon>
        <p>{{ message || '邮箱验证成功！' }}</p>
        <router-link to="/login">
          <el-button type="primary">前往登录</el-button>
        </router-link>
      </div>
      <div v-else class="status-section error">
         <el-icon color="var(--el-color-error)" :size="24"><CircleCloseFilled /></el-icon>
        <p>{{ message || '邮箱验证失败，链接可能无效或已过期。' }}</p>
         <router-link to="/login">
          <el-button>返回登录</el-button>
        </router-link>
        <!-- Optionally add a button to resend verification -->
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElCard, ElButton, ElIcon, ElEmpty } from 'element-plus';
import { Loading, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue';
import { AuthService } from '@/services/AuthService'; // Assuming AuthService exists

const route = useRoute();
const isLoading = ref(true);
const verificationStatus = ref<'pending' | 'success' | 'error'>('pending');
const message = ref('');

// We need an verifyEmail method in AuthService
const verifyEmailToken = async (token: string) => {
    isLoading.value = true;
    verificationStatus.value = 'pending';
    message.value = '';
    try {
        // This method needs to be added to AuthService
        const response = await AuthService.verifyEmail(token);
        message.value = response.message;
        verificationStatus.value = 'success';
    } catch (error: any) {
        console.error('Email verification failed:', error);
        message.value = error.response?.data?.message || '邮箱验证失败，请稍后重试或联系支持。'
        verificationStatus.value = 'error';
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    const token = route.query.token as string;
    if (token) {
        verifyEmailToken(token);
    } else {
        message.value = '无效的验证链接，缺少 Token。';
        verificationStatus.value = 'error';
        isLoading.value = false;
    }
});

</script>

<style scoped lang="scss">
.verify-email-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px); 
  background-color: #f5f7fa;
}

.verify-card {
  width: 450px;
  text-align: center;
  .card-header h2 {
     margin: 0;
  }
}

.status-section {
  padding: 30px 20px;
  p {
    margin: 15px 0 25px 0;
    font-size: 1.1rem;
  }
  .el-icon {
    margin-bottom: 10px;
  }
}
.status-section.success {
    color: var(--el-color-success);
}
.status-section.error {
    color: var(--el-color-error);
}
</style> 