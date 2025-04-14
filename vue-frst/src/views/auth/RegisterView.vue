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
            <img src="/assets/images/register-illustration.svg" alt="Illustration" />
          </div>
        </div>
      </div>

      <!-- Right Side - Register Form -->
      <div class="auth-forms">
        <div class="form-container">
          <!-- Header with Title -->
          <div class="form-header">
            <h2 class="form-title">创建账号</h2>
            <p class="form-subtitle">加入我们的美食社区，开始您的美食之旅</p>
          </div>

          <!-- Register Form -->
          <div class="form-wrapper">
            <el-form
              ref="registerFormRef"
              :model="registerForm"
              :rules="registerRules"
              label-position="top"
              status-icon
              @keyup.enter="submitRegister"
              class="auth-form"
            >
              <el-form-item label="用户名" prop="username" class="custom-form-item">
                <el-input
                  v-model="registerForm.username"
                  placeholder="创建用于登录的用户名 (至少3位)"
                  :prefix-icon="User"
                  class="custom-input"
                ></el-input>
              </el-form-item>
              <el-form-item label="邮箱" prop="email" class="custom-form-item">
                <el-input
                  v-model="registerForm.email"
                  placeholder="用于验证和密码找回"
                  :prefix-icon="Message"
                  class="custom-input"
                ></el-input>
              </el-form-item>
              <el-form-item label="密码" prop="password" class="custom-form-item">
                <el-input
                  type="password"
                  v-model="registerForm.password"
                  placeholder="请输入至少 6 位密码"
                  show-password
                  :prefix-icon="Lock"
                  class="custom-input"
                ></el-input>
              </el-form-item>
              <el-form-item label="确认密码" prop="confirmPassword" class="custom-form-item">
                <el-input
                  type="password"
                  v-model="registerForm.confirmPassword"
                  placeholder="请再次输入密码"
                  show-password
                  :prefix-icon="Lock"
                  class="custom-input"
                ></el-input>
              </el-form-item>

              <!-- Terms and Conditions -->
              <el-form-item prop="agreement" class="agreement-item">
                <el-checkbox v-model="registerForm.agreement">
                  我已阅读并同意 <el-link type="primary">用户协议</el-link> 和 <el-link type="primary">隐私政策</el-link>
                </el-checkbox>
              </el-form-item>

              <el-form-item class="button-item">
                <el-button
                  type="primary"
                  @click="submitRegister"
                  :loading="loading"
                  class="submit-button"
                >
                  立即注册
                </el-button>
              </el-form-item>
            </el-form>

            <!-- Login Link -->
            <div class="login-link-container">
              <span>已有账号？</span>
              <el-link type="primary" @click="goToLogin" class="login-link">直接登录</el-link>
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
import { User, Lock, Message } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/modules/user'
import { ElMessage, type FormInstance, type FormRules, ElCheckbox, ElLink } from 'element-plus'
import { AuthService } from '@/services/AuthService'

const router = useRouter()
const userStore = useUserStore()
const registerFormRef = ref<FormInstance | null>(null)
const loading = ref(false)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreement: false, // 新增协议同意选项
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

// 确认密码校验
const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 校验规则
const registerRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度至少为 3 位', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { validator: validateEmail, trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
  agreement: [
    { validator: (rule: any, value: any, callback: any) => {
      if (!value) {
        callback(new Error('请阅读并同意用户协议和隐私政策'))
      } else {
        callback()
      }
    }, trigger: 'change' }
  ],
})

// 提交注册
const submitRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      if (!registerForm.agreement) {
        ElMessage.warning('请阅读并同意用户协议和隐私政策')
        return
      }

      loading.value = true
      try {
        await AuthService.register({
          name: registerForm.username,
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
        })

        ElMessage.success('注册成功，请登录')
        router.push('/login')
      } catch (error: any) {
        let errorMessage = '注册失败，请稍后再试'
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }
        ElMessage.error(`注册失败: ${errorMessage}`)
      } finally {
        loading.value = false
      }
    } else {
      console.log('注册表单校验失败')
    }
  })
}

// 跳转登录
const goToLogin = () => {
  router.push('/login')
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

// 全局容器样式
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: $background-light;
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba($primary-color, 0.05) 0%, rgba($secondary-color, 0.05) 100%);
    z-index: 0;
  }
}

// 主内容区域
.auth-content {
  display: flex;
  width: 900px;
  height: 600px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px $shadow-color;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

// 左侧品牌区域
.auth-branding {
  flex: 1;
  background: linear-gradient(135deg, $primary-color 0%, color.adjust($primary-color, $lightness: -15%) 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('/assets/images/pattern.svg');
    background-size: cover;
    opacity: 0.1;
  }

  .brand-content {
    position: relative;
    z-index: 2;
    text-align: center;
    width: 100%;
  }

  .logo-container {
    margin-bottom: 20px;

    .logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
    }
  }

  .brand-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 10px;
    letter-spacing: 1px;
  }

  .brand-slogan {
    font-size: 1.2rem;
    opacity: 0.9;
    margin-bottom: 40px;
  }

  .illustration {
    max-width: 80%;
    margin: 0 auto;

    img {
      width: 100%;
      height: auto;
    }
  }
}

// 右侧表单区域
.auth-forms {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px;

  .form-container {
    width: 100%;
    max-width: 380px;
    margin: 0 auto;
  }

  .form-header {
    margin-bottom: 30px;

    .form-title {
      font-size: 1.8rem;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 8px;
    }

    .form-subtitle {
      font-size: 1rem;
      color: $text-secondary;
    }
  }

  .form-wrapper {
    .auth-form {
      margin-bottom: 20px;
    }
  }

  // 自定义表单元素
  .custom-form-item {
    margin-bottom: 24px;

    :deep(.el-form-item__label) {
      padding-bottom: 8px;
      font-weight: 500;
      color: $text-primary;
    }

    .custom-input {
      :deep(.el-input__wrapper) {
        padding: 0 15px;
        height: 48px;
        box-shadow: 0 0 0 1px $border-color inset;
        border-radius: 8px;
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 0 0 1px $primary-color inset;
        }

        &.is-focus {
          box-shadow: 0 0 0 1px $primary-color inset;
        }
      }

      :deep(.el-input__prefix) {
        color: $text-light;
      }
    }
  }

  // 协议选项
  .agreement-item {
    margin-bottom: 24px;

    :deep(.el-checkbox__label) {
      color: $text-secondary;
      font-size: 0.9rem;

      .el-link {
        font-size: 0.9rem;
      }
    }
  }

  // 注册按钮
  .button-item {
    margin-bottom: 20px;

    .submit-button {
      width: 100%;
      height: 48px;
      font-size: 1rem;
      font-weight: 500;
      border-radius: 8px;
      background-color: $primary-color;
      border-color: $primary-color;
      transition: all 0.3s;

      &:hover {
        background-color: color.adjust($primary-color, $lightness: -5%);
        border-color: color.adjust($primary-color, $lightness: -5%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba($primary-color, 0.4);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  // 登录链接
  .login-link-container {
    text-align: center;
    color: $text-secondary;
    font-size: 0.9rem;

    .login-link {
      font-weight: 500;
      margin-left: 5px;
      transition: color 0.3s;

      &:hover {
        color: color.adjust($primary-color, $lightness: -10%);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .auth-content {
    flex-direction: column;
    width: 100%;
    height: auto;
    border-radius: 0;
  }

  .auth-branding {
    padding: 30px 20px;

    .brand-title {
      font-size: 2rem;
    }

    .brand-slogan {
      font-size: 1rem;
      margin-bottom: 20px;
    }

    .illustration {
      display: none;
    }
  }

  .auth-forms {
    padding: 30px 20px;
  }
}
</style>
