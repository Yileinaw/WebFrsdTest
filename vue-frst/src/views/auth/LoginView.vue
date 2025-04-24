<template>
  <div class="auth-container">
    <div class="auth-content">
      <!-- Left Side - Illustration/Branding -->
      <div class="auth-branding">
        <div class="brand-content">
          <div class="logo-container">
            <img src="/assets/images/logo.png" alt="Logo" class="logo" />
          </div>
          <h1 class="brand-title">美食社区</h1>
          <p class="brand-slogan">发现美食，分享生活</p>
          <div class="illustration">
            <img src="/assets/images/auth-illustration.svg" alt="Illustration" />
          </div>
        </div>
      </div>

      <!-- Right Side - Auth Forms -->
      <div class="auth-forms">
        <div class="form-container">
          <!-- Header with Title -->
          <div class="form-header">
            <h2 class="form-title">{{ viewMode === 'login' ? '欢迎登录' : '找回密码' }}</h2>
            <p class="form-subtitle">{{ viewMode === 'login' ? '请登录您的账号以继续' : '我们将发送重置密码邮件给您' }}</p>
          </div>

          <!-- Login Form -->
          <div v-if="viewMode === 'login'" class="form-wrapper">
            <el-form
              ref="loginFormRef"
              :model="loginForm"
              :rules="loginRules"
              label-position="top"
              @submit.prevent="handleLogin"
              class="auth-form"
            >
              <el-form-item label="用户名或邮箱" prop="identifier" class="custom-form-item">
                <el-input
                  v-model="loginForm.identifier"
                  placeholder="请输入用户名或邮箱"
                  :prefix-icon="User"
                  class="custom-input"
                ></el-input>
              </el-form-item>
              <el-form-item label="密码" prop="password" class="custom-form-item">
                <el-input
                  type="password"
                  v-model="loginForm.password"
                  placeholder="请输入密码"
                  show-password
                  :prefix-icon="Lock"
                  class="custom-input"
                ></el-input>
              </el-form-item>

              <!-- Remember me & Forgot password -->
              <div class="form-options">
                <el-checkbox v-model="rememberMe">记住我</el-checkbox>
                <el-link type="primary" @click="viewMode = 'forgotPassword'" class="forgot-link">忘记密码？</el-link>
              </div>

              <el-form-item class="button-item">
                <el-button type="primary" native-type="submit" :loading="loading" class="submit-button">
                  登录
                </el-button>
              </el-form-item>

              <!-- Resend Verification Link (Conditional) -->
              <el-form-item v-if="showResendLink" class="verification-item">
                <el-link
                  type="warning"
                  @click="handleResendVerification"
                  :loading="isResending"
                  :disabled="isResending"
                  class="verification-link"
                >
                  邮箱未验证？点此重新发送验证邮件
                </el-link>
              </el-form-item>
            </el-form>

            <!-- Social Login Options -->
            <div class="social-login">
              <div class="divider">
                <span>或者使用以下方式登录</span>
              </div>
              <div class="social-icons">
                <el-button class="social-icon wechat" circle>
                  <i class="fab fa-weixin"></i>
                </el-button>
                <el-button class="social-icon qq" circle>
                  <i class="fab fa-qq"></i>
                </el-button>
                <el-button class="social-icon weibo" circle>
                  <i class="fab fa-weibo"></i>
                </el-button>
              </div>
            </div>

            <!-- Register Link -->
            <div class="register-link-container">
              <span>还没有账号？</span>
              <router-link to="/register" class="register-link">立即注册</router-link>
            </div>
          </div>

          <!-- Forgot Password Form -->
          <div v-else-if="viewMode === 'forgotPassword'" class="form-wrapper">
            <el-form
              ref="forgotPasswordFormRef"
              :model="forgotPasswordForm"
              :rules="forgotPasswordRules"
              label-position="top"
              @submit.prevent="handleSendResetCode"
              class="auth-form"
            >
              <el-form-item label="注册邮箱" prop="email" class="custom-form-item">
                <el-input
                  v-model="forgotPasswordForm.email"
                  placeholder="请输入您注册时使用的邮箱"
                  :prefix-icon="Message"
                  @keydown.enter.prevent="handleSendResetCode"
                  class="custom-input"
                />
              </el-form-item>
              <el-form-item class="button-item">
                <el-button
                  type="primary"
                  native-type="submit"
                  :loading="isSendingCode"
                  class="submit-button"
                >
                  发送重置邮件
                </el-button>
              </el-form-item>
            </el-form>

            <!-- Back to Login -->
            <div class="back-to-login">
              <el-link type="primary" @click="viewMode = 'login'" class="back-link">
                <el-icon><ArrowLeft /></el-icon> 返回登录
              </el-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Message, ArrowLeft } from '@element-plus/icons-vue'
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
  ElCheckbox,
  ElDivider,
} from 'element-plus'
import { AuthService } from '@/services/AuthService'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref<FormInstance | null>(null)
const loading = ref(false)
const viewMode = ref<'login' | 'forgotPassword'>('login')
const showResendLink = ref(false)
const isResending = ref(false)
const rememberMe = ref(false) // 新增记住我选项

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
        console.log('开始登录请求，数据:', loginForm)
        await userStore.login(loginForm)
        ElMessage.success('登录成功')
        const redirect = (router.currentRoute.value.query.redirect as string) || '/'
        router.push(redirect)
      } catch (error: any) {
        console.error('登录失败:', error)
        console.error('错误详情:', error.response || error.message || error)
        let errorMessage = '登录失败，请检查用户名/邮箱和密码'
        if (error?.response?.data?.message) {
          errorMessage = error.response.data.message
          console.log('从响应中提取错误消息:', errorMessage)
        } else if (error instanceof Error) {
          errorMessage = error.message
          console.log('从错误对象中提取错误消息:', errorMessage)
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
  const identifier = loginForm.identifier
  // 简单的邮箱格式校验
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  if (!identifier || !emailRegex.test(identifier)) {
      // 修改错误提示，引导用户输入邮箱
      ElMessage.error('请在"用户名或邮箱"输入框中输入您注册时使用的邮箱地址，然后重试发送验证邮件。')
      return
  }

  // 如果是有效的邮箱地址，则继续
  const email = identifier;
  isResending.value = true
  try {
      const response = await AuthService.resendVerificationEmail(email)
      ElMessage.success(response.message || '验证邮件已发送，请检查您的收件箱。')
      showResendLink.value = false // 发送成功后可以隐藏链接
  } catch (error: any) {
      console.error('Resend verification email failed:', error)
      ElMessage.error(error.response?.data?.message || '重新发送验证邮件失败，请稍后重试。')
  } finally {
      isResending.value = false
  }
}
</script>

<style scoped lang="scss">
// 引入sass:color
@use "sass:color";

// 主色调变量
$primary-color: #1890ff;
$secondary-color: #ff7d00;
$text-primary: #303133;
$text-secondary: #606266;
$text-light: #909399;
$border-color: #e4e7ed;
$background-light: #f5f7fa;
$background-dark: #f0f2f5;
$shadow-color: rgba(0, 0, 0, 0.1);
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;

// 全局容器样式 - 设为全屏高度
.auth-container {
  display: flex;
  min-height: 100vh;
  background-color: $background-light;
}

// 主内容区域 - 取消固定大小和阴影
.auth-content {
  display: flex;
  width: 100%;
}

// 左侧品牌区域 - 调整 flex 比例和内边距
.auth-branding {
  flex: 0 0 45%;
  background: linear-gradient(135deg, $primary-color 0%, color.adjust($primary-color, $lightness: -15%) 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 40px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('/assets/images/pattern.svg'); // Keep pattern if desired
    background-size: cover;
    opacity: 0.1;
  }

  .brand-content {
    position: relative;
    z-index: 2;
    text-align: center;
    width: 100%;
    max-width: 450px;
  }

  .logo-container { margin-bottom: 25px; .logo { width: 90px; height: 90px; object-fit: contain; }}
  .brand-title { font-size: 2.8rem; font-weight: 700; margin-bottom: 15px; letter-spacing: 1px; }
  .brand-slogan { font-size: 1.3rem; opacity: 0.9; margin-bottom: 50px; }
  .illustration { max-width: 90%; margin: 0 auto; img { width: 100%; height: auto; } }
}

// 右侧表单区域 - 调整 flex 比例，允许滚动
.auth-forms {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center; // Center form vertically
  padding: 60px 40px;
  overflow-y: auto; // Allow scrolling

  .form-container {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }

  .form-header { margin-bottom: 35px;
     .form-title { font-size: 1.8rem; font-weight: 600; color: $text-primary; margin-bottom: 8px; }
     .form-subtitle { font-size: 1rem; color: $text-secondary; }
  }
  .form-wrapper { .auth-form { margin-bottom: 20px; } }
  .custom-form-item {
    margin-bottom: 28px;
    :deep(.el-form-item__label) { padding-bottom: 8px; font-weight: 500; color: $text-primary; }
    .custom-input {
      :deep(.el-input__wrapper) {
        padding: 0 15px; height: 48px; box-shadow: 0 0 0 1px $border-color inset; border-radius: 8px; transition: all 0.3s;
        &:hover { box-shadow: 0 0 0 1px $primary-color inset; }
        &.is-focus { box-shadow: 0 0 0 1px $primary-color inset; }
      }
      :deep(.el-input__prefix) { color: $text-light; }
    }
  }
  .form-options { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px;
    :deep(.el-checkbox__label) { color: $text-secondary; }
    .forgot-link { font-size: 0.9rem; }
  }
  .button-item {
    margin-bottom: 25px;
    .submit-button {
      width: 100%; height: 48px; font-size: 1rem; font-weight: 500; border-radius: 8px; background-color: $primary-color; border-color: $primary-color; transition: all 0.3s;
      &:hover { background-color: color.adjust($primary-color, $lightness: -5%); border-color: color.adjust($primary-color, $lightness: -5%); transform: translateY(-1px); box-shadow: 0 4px 12px rgba($primary-color, 0.4); }
      &:active { transform: translateY(0); }
    }
  }
  .verification-item { text-align: center; margin-bottom: 20px; .verification-link { font-size: 0.9rem; } }
  .social-login {
    margin-bottom: 35px;
    .divider { display: flex; align-items: center; margin: 20px 0; color: $text-light; font-size: 0.9rem;
      &::before, &::after { content: ''; flex: 1; height: 1px; background-color: $border-color; }
      span { padding: 0 15px; }
    }
    .social-icons { display: flex; justify-content: center; gap: 20px;
      .social-icon {
        width: 44px; height: 44px; font-size: 1.2rem; border: 1px solid $border-color; background-color: white; transition: all 0.3s;
        &:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
        &.wechat:hover { color: #07c160; border-color: #07c160; }
        &.qq:hover { color: #12b7f5; border-color: #12b7f5; }
        &.weibo:hover { color: #e6162d; border-color: #e6162d; }
      }
    }
  }
  .register-link-container { text-align: center; color: $text-secondary; font-size: 0.9rem; margin-top: 20px;
    .register-link { color: $primary-color; font-weight: 500; margin-left: 5px; text-decoration: none; transition: color 0.3s; &:hover { color: color.adjust($primary-color, $lightness: -10%); text-decoration: underline; } }
  }
  .back-to-login { text-align: center; margin-top: 25px;
    .back-link { display: inline-flex; align-items: center; font-size: 0.9rem; i { margin-right: 5px; } }
  }
}

// 响应式设计
@media (max-width: 992px) {
  .auth-content { flex-direction: column; }
  .auth-branding {
    flex: 0 0 auto;
    padding: 40px 20px;
    min-height: 300px;
    .brand-content { max-width: 400px; }
    .logo-container { margin-bottom: 20px; .logo { width: 70px; height: 70px; } }
    .brand-title { font-size: 2.2rem; }
    .brand-slogan { font-size: 1.1rem; margin-bottom: 30px; }
    .illustration { max-width: 60%; }
  }
  .auth-forms {
    flex: 1;
    padding: 40px 20px;
    justify-content: flex-start;
    .form-container {
       max-width: 450px;
       margin-top: 30px;
       margin-bottom: 30px;
    }
  }
}

@media (max-width: 576px) {
   .auth-branding { padding: 30px 15px; min-height: 250px; }
   .auth-forms { padding: 30px 15px; }
   .form-container { margin-top: 20px; margin-bottom: 20px; }
}
</style>
