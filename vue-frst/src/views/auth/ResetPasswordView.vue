<template>
  <div class="reset-password-container">
    <el-card class="reset-password-card">
      <template #header>
        <div class="card-header">
          <h2>重置密码</h2>
        </div>
      </template>
      <el-form
        ref="resetFormRef"
        :model="resetForm"
        :rules="resetRules"
        label-position="top"
        @submit.prevent="handleResetPassword"
      >
        <el-form-item label="邮箱地址" prop="email">
          <el-input v-model="resetForm.email" placeholder="请输入您的邮箱地址" />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <el-input v-model="resetForm.code" placeholder="请输入收到的6位验证码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input type="password" v-model="resetForm.newPassword" placeholder="请输入新密码（至少6位）" show-password />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input type="password" v-model="resetForm.confirmPassword" placeholder="请再次输入新密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%;">确认重置</el-button>
        </el-form-item>
      </el-form>
      <div class="extra-links">
        <router-link to="/login">
          <el-link type="primary">返回登录</el-link>
        </router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { AuthService } from '@/services/AuthService'; // Assuming AuthService exists

const router = useRouter();
const route = useRoute(); // To potentially get email/code from query params

const resetFormRef = ref<FormInstance>();
const resetForm = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
});
const loading = ref(false);

// --- Validation Rules ---
const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'));
  } else if (value !== resetForm.newPassword) {
    callback(new Error("两次输入的新密码不一致!"));
  } else {
    callback();
  }
};

const resetRules = reactive<FormRules<typeof resetForm>>({
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码必须为6位数字', trigger: 'blur' } // Assuming 6-digit code
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
});

// Populate email/code from query params if available
onMounted(() => {
  if (route.query.email) {
    resetForm.email = route.query.email as string;
  }
  if (route.query.code) {
    resetForm.code = route.query.code as string;
  }
});

// --- Submit Handler ---
const handleResetPassword = async () => {
  if (!resetFormRef.value) return;
  await resetFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        // We need a resetPassword method in AuthService
        const response = await AuthService.resetPassword({
          email: resetForm.email,
          code: resetForm.code,
          newPassword: resetForm.newPassword,
          confirmPassword: resetForm.confirmPassword // Backend expects this too
        });
        ElMessage.success(response.message || '密码重置成功');
        // Redirect to login page after successful reset
        router.push('/login');
      } catch (error: any) {
        console.error('Password reset failed:', error);
        ElMessage.error(error.response?.data?.message || '密码重置失败，请检查邮箱或验证码');
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped lang="scss">
.reset-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
  background-color: #f5f7fa;
}

.reset-password-card {
  width: 450px; // Slightly wider for more fields
  .card-header {
    text-align: center;
  }
}

.extra-links {
  text-align: center;
  margin-top: 15px;
}
</style> 