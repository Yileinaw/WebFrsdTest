<template>
  <el-dialog
    :model-value="visible" 
    title="修改密码"
    width="500px"
    @close="handleClose" 
    :close-on-click-modal="false" 
    append-to-body
  >
    <el-form 
      :model="passwordForm" 
      :rules="passwordRules" 
      ref="passwordFormRef" 
      label-width="100px" 
      class="password-form"
      @submit.prevent="changePasswordHandler" 
    >
      <el-form-item label="旧密码" prop="oldPassword">
        <el-input type="password" v-model="passwordForm.oldPassword" show-password></el-input>
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input type="password" v-model="passwordForm.newPassword" show-password></el-input>
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input type="password" v-model="passwordForm.confirmPassword" show-password></el-input>
      </el-form-item>
      <el-form-item label="验证码" prop="code">
        <el-input v-model="passwordForm.code" style="width: calc(100% - 120px); margin-right: 10px;" placeholder="6位邮箱验证码"></el-input>
        <el-button @click="sendCode" :disabled="isSendingCode || countdown > 0" style="width: 110px;">
          {{ countdown > 0 ? `${countdown}s后重发` : '发送验证码' }}
        </el-button>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="changePasswordHandler" :loading="isChangingPassword">
          确认修改
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { UserService } from '@/services/UserService';
import type { ChangePasswordPayload } from '@/types/payloads';

// --- Props and Emits ---
interface Props {
  visible: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits(['update:visible']);

// --- Component State ---
const passwordFormRef = ref<FormInstance>();
const passwordForm = reactive<ChangePasswordPayload & { confirmPassword: string }>({ 
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  code: ''
});
const isSendingCode = ref(false);
const countdown = ref(0);
let countdownTimer: number | undefined = undefined;
const isChangingPassword = ref(false);

// --- Validation Rules ---
const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'));
  } else if (value !== passwordForm.newPassword) {
    callback(new Error("两次输入的新密码不一致!"));
  } else {
    callback();
  }
};

const passwordRules = reactive<FormRules<typeof passwordForm>>({
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入邮箱验证码', trigger: 'blur' },
    { len: 6, message: '验证码必须为6位', trigger: 'blur' } 
  ]
});

// --- Methods ---
const handleClose = () => {
  // Reset form validation and state when closing
  passwordFormRef.value?.resetFields();
  // Clear countdown if active
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = undefined;
    countdown.value = 0;
  }
  emit('update:visible', false);
};

const sendCode = async () => {
  isSendingCode.value = true;
  try {
    const response = await UserService.sendPasswordResetCode();
    ElMessage.success(response.message || '验证码已发送');
    countdown.value = 60;
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = undefined;
      }
    }, 1000);
  } catch (error: any) {
    console.error('Send code failed:', error);
    ElMessage.error(error.response?.data?.message || '发送验证码失败');
  } finally {
    isSendingCode.value = false;
  }
};

const changePasswordHandler = async () => {
  if (!passwordFormRef.value) return;
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      isChangingPassword.value = true;
      try {
        const payload: ChangePasswordPayload = {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
          code: passwordForm.code,
          confirmPassword: passwordForm.confirmPassword
        };

        const response = await UserService.changePassword(payload);
        ElMessage.success(response.message || '密码修改成功');
        handleClose(); // Close modal on success

      } catch (error: any) {
        console.error('Change password failed:', error);
      } finally {
        isChangingPassword.value = false;
      }
    } else {
      console.log('Password form validation failed');
    }
  });
};

// --- Watch for visibility change to reset form ---
// Optional: reset form every time dialog opens
// watch(() => props.visible, (newValue) => {
//   if (newValue) {
//     passwordFormRef.value?.resetFields();
//   }
// });

// --- Cleanup Timer on Unmount ---
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});

</script>

<style scoped lang="scss">
/* Optional: Adjust footer layout if needed */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 