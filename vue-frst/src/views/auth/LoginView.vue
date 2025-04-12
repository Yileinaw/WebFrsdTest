<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <!-- TODO: Add logo? -->
        <div class="card-header">
          <!-- Dynamic title based on viewMode -->
          <h2>{{ viewMode === 'login' ? '用户登录' : '忘记密码' }}</h2>
        </div>
      </template>

      <!-- Login Form -->
      <div v-if="viewMode === 'login'">
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          label-position="top"
          @submit.prevent="handleLogin"
        >
          <el-form-item label="用户名或邮箱" prop="identifier">
            <el-input
              v-model="loginForm.identifier"
              placeholder="请输入用户名或邮箱"
              :prefix-icon="User"
            ></el-input>
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              type="password"
              v-model="loginForm.password"
              placeholder="请输入密码"
              show-password
              :prefix-icon="Lock"
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%"
              >登录</el-button
            >
          </el-form-item>

          <!-- Resend Verification Link (Conditional) -->
          <el-form-item v-if="showResendLink">
            <el-link
              type="warning"
              @click="handleResendVerification"
              :loading="isResending"
              :disabled="isResending"
            >
              邮箱未验证？点此重新发送验证邮件
            </el-link>
          </el-form-item>
        </el-form>
        <div class="extra-links">
          <el-link type="primary" @click="viewMode = 'forgotPassword'">忘记密码？</el-link>
          <router-link to="/register">
            <el-link type="primary">没有账号？去注册</el-link>
          </router-link>
        </div>
      </div>

      <!-- Forgot Password Form -->
      <div v-else-if="viewMode === 'forgotPassword'">
        <el-form
          ref="forgotPasswordFormRef"
          :model="forgotPasswordForm"
          :rules="forgotPasswordRules"
          label-position="top"
          @submit.prevent="handleSendResetCode"
        >
          <el-form-item label="注册邮箱" prop="email">
            <el-input
              v-model="forgotPasswordForm.email"
              placeholder="请输入您注册时使用的邮箱"
              :prefix-icon="Message"
              @keydown.enter.prevent="handleSendResetCode"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              native-type="submit"
              :loading="isSendingCode"
              style="width: 100%"
            >
              发送重置邮件
            </el-button>
          </el-form-item>
        </el-form>
        <div class="extra-links">
          <el-link type="primary" @click="viewMode = 'login'">返回登录</el-link>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Message } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/modules/user'
import {
  ElMessage,
  type FormInstance,
  type FormRules,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElLink,
  ElCard,
} from 'element-plus'
import { AuthService } from '@/services/AuthService'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref<FormInstance | null>(null)
const loading = ref(false)
const viewMode = ref<'login' | 'forgotPassword'>('login')
const showResendLink = ref(false)
const isResending = ref(false)

const loginForm = reactive({
  identifier: '',
  password: '',
})

// 邮箱校验
const validateEmail = (rule: any, value: any, callback: any) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  if (!value) {
    return callback(new Error('请输入邮箱地址'))
  }
  if (!emailRegex.test(value)) {
    callback(new Error('请输入有效的邮箱地址'))
  } else {
    callback()
  }
}

// 校验规则
const loginRules = reactive<FormRules>({
  identifier: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 3, message: '输入长度至少为 3 位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为 6 位', trigger: 'blur' },
  ],
})

// 提交登录 - 重命名为 handleLogin
const handleLogin = async () => {
  if (!loginFormRef.value) return
  showResendLink.value = false
  await loginFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(loginForm)
        ElMessage.success('登录成功')
        const redirect = (router.currentRoute.value.query.redirect as string) || '/'
        router.push(redirect)
      } catch (error: any) {
        console.error('Login failed:', error)
        let errorMessage = '登录失败，请检查用户名/邮箱和密码'
        if (error?.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error instanceof Error) {
          errorMessage = error.message
        }

        if (typeof errorMessage === 'string' && errorMessage.startsWith('[message:')) {
          try {
            const match = errorMessage.match(/\[message:\s*"(.*?)"\]/)
            if (match && match[1]) {
              errorMessage = match[1]
            }
          } catch (e) {
            /* Ignore parsing error */
          }
        }

        ElMessage.error(errorMessage)

        if (errorMessage.includes('邮箱尚未验证')) {
          showResendLink.value = true
        }
      } finally {
        loading.value = false
      }
    } else {
      console.log('登录表单校验失败')
    }
  })
}

// 跳转注册
const goToRegister = () => {
  router.push('/register')
}

// --- Forgot Password Logic (No longer uses dialog state) ---
// const showForgotPasswordDialog = ref(false); // Remove dialog state
const forgotPasswordFormRef = ref<FormInstance>()
const forgotPasswordForm = reactive({ email: '' })
const isSendingCode = ref(false)

const forgotPasswordRules = reactive<FormRules<typeof forgotPasswordForm>>({
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] },
  ],
})

const handleSendResetCode = async () => {
  if (!forgotPasswordFormRef.value) return
  await forgotPasswordFormRef.value.validate(async (valid) => {
    if (valid) {
      isSendingCode.value = true
      try {
        const response = await AuthService.sendPublicPasswordResetCode(forgotPasswordForm.email)
        ElMessage.success(response.message || '请求已发送，请检查您的邮箱')
        // showForgotPasswordDialog.value = false; // No longer need to close dialog

        // Navigate to reset password page with email pre-filled
        router.push({
          path: '/reset-password',
          query: { email: forgotPasswordForm.email },
        })
        // Reset viewMode back to login after navigation? Or leave it to user clicking back?
        // viewMode.value = 'login'; // Optional: Reset view after navigation
      } catch (error: any) {
        console.error('Send reset code failed:', error)
        ElMessage.error(error.response?.data?.message || '发送失败，请稍后重试')
      } finally {
        isSendingCode.value = false
      }
    }
  })
}

// --- Resend Verification Logic ---
const handleResendVerification = async () => {
  ElMessage.info('请确保您的账户已激活。如果需要重新发送验证邮件，请联系支持。')
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px); // Adjust based on header/footer height
  background-color: #f5f7fa;
}

.login-card {
  width: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.card-header {
  text-align: center;
  font-size: 1.6rem;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.el-form {
  .el-form-item {
    margin-bottom: 25px;
  }

  .login-btn-item {
    margin-bottom: 15px;
    .el-form-item__content {
      justify-content: center;
    }
    .login-button {
      width: 100%;
    }
  }
}

.extra-links {
  display: flex;
  justify-content: space-between; // Keep space between for login view
  margin-top: 15px;
  & > * {
    // Add some spacing for single link view
    margin: 0 5px;
  }
  a {
    // Ensure router-link doesn't add underline if not desired
    text-decoration: none;
  }
}

// Style for the resend link if needed
.el-form-item .el-link[type='warning'] {
  font-size: 0.9rem;
  /* Add other styles like margin if needed */
}
</style>
