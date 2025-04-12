<template>
  <el-card class="user-profile-card">
    <template #header>
      <div class="card-header">
        <span>账号设置</span>
      </div>
    </template>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="编辑资料" name="edit">
         <el-form :model="profileForm" label-width="80px" class="edit-form">
            <el-form-item label="昵称">
              <el-input v-model="profileForm.name"></el-input>
            </el-form-item>
            <el-form-item label="简介">
              <el-input type="textarea" v-model="profileForm.bio" :rows="3"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="updateProfile" :loading="loading">保存资料</el-button>
            </el-form-item>
          </el-form>
      </el-tab-pane>

      <el-tab-pane label="修改密码" name="password">
        <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px" class="password-form">
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
            <el-input v-model="passwordForm.code" style="width: 150px; margin-right: 10px;"></el-input>
            <el-button @click="sendCode" :disabled="isSendingCode || countdown > 0">
              {{ countdown > 0 ? `${countdown}秒后重发` : '发送验证码' }}
            </el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="changePasswordHandler" :loading="isChangingPassword">确认修改</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

    </el-tabs>

  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/modules/user' // 引入 User Store
// import defaultAvatar from '@/assets/images/default-avatar.png' // Removed if not used
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { UserService } from '@/services/UserService' // 导入 UserService
import type { ChangePasswordPayload } from '@/types/payloads' // <-- Import payload type

const userStore = useUserStore()
const loading = ref(false)
const activeTab = ref('edit') // Default to edit tab

const profileForm = reactive({
  name: '',
  bio: '' // Added bio
  // email: '' // Removed email
})

// --- Password Change Form State ---
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive<ChangePasswordPayload & { confirmPassword: string }>({ // Add confirmPassword locally
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  code: ''
})
const isSendingCode = ref(false)
const countdown = ref(0)
let countdownTimer: number | undefined = undefined
const isChangingPassword = ref(false)

// --- Validation Rules ---
const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error("两次输入的新密码不一致!"))
  } else {
    callback()
  }
}

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
    { len: 6, message: '验证码必须为6位', trigger: 'blur' } // Assuming 6-digit code
  ]
})

// 在组件挂载时，用当前用户信息填充表单
onMounted(() => {
  if (userStore.currentUser) {
    profileForm.name = userStore.currentUser.name || ''
    profileForm.bio = userStore.currentUser.bio || '' // Populate bio
  }
})

// 更新个人信息
const updateProfile = async () => {
  loading.value = true
  const dataToUpdate: { name?: string | null, bio?: string | null } = {};
  // Check if name has changed
  if (profileForm.name !== (userStore.currentUser?.name || '')) {
    dataToUpdate.name = profileForm.name;
  }
  // Check if bio has changed
  if (profileForm.bio !== (userStore.currentUser?.bio || '')) {
    dataToUpdate.bio = profileForm.bio;
  }

  if (Object.keys(dataToUpdate).length === 0) {
    ElMessage.info('未检测到资料更改');
    loading.value = false;
    return;
  }

  console.log('Updating profile:', dataToUpdate);
  try {
    const response = await UserService.updateMyProfile(dataToUpdate);
    userStore.updateUserInfo(response.user); // Use dedicated store action
    ElMessage.success('个人资料更新成功');
    // No need to switch tab
  } catch (error: any) {
    console.error('Profile update failed:', error)
    ElMessage.error(error.response?.data?.message || '更新失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// Send Verification Code
const sendCode = async () => {
  isSendingCode.value = true
  try {
    const response = await UserService.sendPasswordResetCode()
    ElMessage.success(response.message || '验证码已发送')
    // Start countdown
    countdown.value = 60
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = undefined
      }
    }, 1000)
  } catch (error: any) {
    console.error('Send code failed:', error)
    ElMessage.error(error.response?.data?.message || '发送验证码失败')
  } finally {
    isSendingCode.value = false
  }
}

// Change Password
const changePasswordHandler = async () => {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      isChangingPassword.value = true
      try {
        const payload: ChangePasswordPayload = {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
          code: passwordForm.code,
          // confirmPassword is only for front-end validation, not sent to backend
          confirmPassword: '', // Added to satisfy type, but backend ignores it
        }
        // Ensure confirmPassword is removed if backend doesn't expect it
        delete (payload as any).confirmPassword

        const response = await UserService.changePassword(payload)
        ElMessage.success(response.message || '密码修改成功')
        // Reset form and potentially switch tab or logout
        passwordFormRef.value?.resetFields()
        // Optional: Ask user to re-login
        // ElMessageBox.confirm('密码已修改，建议重新登录以确保安全。', '提示', {
        //   confirmButtonText: '重新登录',
        //   cancelButtonText: '稍后',
        //   type: 'success',
        // }).then(() => {
        //   userStore.logout() // Assuming logout action exists
        //   // Redirect to login page
        // }).catch(() => {
        //   // User chose '稍后'
        // })
      } catch (error: any) {
        console.error('Change password failed:', error)
        ElMessage.error(error.response?.data?.message || '密码修改失败')
      } finally {
        isChangingPassword.value = false
      }
    } else {
      console.log('Password form validation failed')
    }
  })
}

// --- Cleanup Timer on Unmount ---
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped lang="scss">
.card-header {
   text-align: center;
   font-size: 1.2rem; // Adjust header size
   font-weight: 600;
   padding-bottom: 15px; // Add some space below header
   border-bottom: 1px solid var(--el-border-color-lighter); // Separator
   margin-bottom: 20px;
}

.edit-form, .password-form {
  max-width: 500px; // Limit form width for better readability
  margin: 20px auto; // Center the form
}
</style> 