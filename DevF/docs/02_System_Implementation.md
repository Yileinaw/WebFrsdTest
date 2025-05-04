# 5.系统实现
本章阐述“基于Web的美食分享推荐网站”核心功能模块的具体实现方法。系统采用前后端分离架构，前端用户界面基于Vue3技术栈构建，后端服务则利用Node.js、Express和Prisma技术栈开发，两者通过标准的RESTfulAPI进行数据通信。

## 5.1用户认证模块
用户认证模块负责管理用户身份的识别与验证，保障系统安全和个性化基础。

### 前端实现
(1) 用户界面:利用Vue3组件和ElementPlusUI库构建了标准化的注册与登录表单界面。这些界面集成了客户端数据校验逻辑，对用户输入（如邮箱格式、必填项）进行初步验证。
(2) 数据通信:用户提交注册或登录信息后，前端通过Axios库向后端指定的API端点（服务接口）发送HTTP请求，传输用户凭证。
(3) 状态管理:登录成功时，后端会返回一个用于身份验证的令牌（Token）。前端负责安全地存储此Token（通常在浏览器的本地存储中），并利用Pinia状态管理库更新全局的用户登录状态。这使得应用程序在不同页面间能保持用户的登录会话。
(4) 访问控制:通过VueRouter的导航守卫机制实现前端的访问控制。在用户尝试访问需要登录权限的页面（如个人中心）之前，守卫会检查是否存在有效的Token和登录状态，若无则自动将用户重定向至登录页面。登出操作则会清除已存储的Token及全局登录状态。
(5) 前端页面实现与示例代码：

### 2.1 登录视图 (LoginView.vue)
```vue
<template>
  <div>
    <h2>欢迎登录</h2>
    <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" @submit.prevent="handleLogin">
      <el-form-item prop="identifier"><el-input v-model="loginForm.identifier" placeholder="用户名或邮箱" /></el-form-item>
      <el-form-item prop="password"><el-input v-model="loginForm.password" type="password" placeholder="密码" show-password /></el-form-item>
      <el-form-item><el-button type="primary" native-type="submit" :loading="loading">登录</el-button></el-form-item>
    </el-form>
    <router-link to="/register">没有账户？去注册</router-link>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/modules/user';
import { ElForm, ElInput, ElButton, ElFormItem, ElMessage, type FormInstance, type FormRules } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();
const loginFormRef = ref<FormInstance>();
const loading = ref(false);
const loginForm = reactive({ identifier: '', password: '' });
const loginRules = reactive<FormRules>({
  identifier: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
});
const handleLogin = async () => {
  if (!loginFormRef.value) return;
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    try {
      await userStore.login(loginForm); // 调用 store 处理登录逻辑
      ElMessage.success('登录成功！');
      router.push('/'); // 跳转首页
    } catch (error: any) { ElMessage.error(error.response?.data?.message || '登录失败'); }
    finally { loading.value = false; }
  });
};
</script>
```

### 2.2 注册视图 (RegisterView.vue)
```vue
<template>
  <div>
    <h2>创建账号</h2>
    <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" @submit.prevent="submitRegister">
      <el-form-item prop="username"><el-input v-model="registerForm.username" placeholder="用户名 (至少3位)" /></el-form-item>
      <el-form-item prop="email"><el-input v-model="registerForm.email" placeholder="邮箱" /></el-form-item>
      <el-form-item prop="password"><el-input v-model="registerForm.password" type="password" placeholder="密码 (至少6位)" show-password /></el-form-item>
      <el-form-item prop="confirmPassword"><el-input v-model="registerForm.confirmPassword" type="password" placeholder="确认密码" show-password /></el-form-item>
      <el-form-item prop="agreement"><el-checkbox v-model="registerForm.agreement">同意用户协议</el-checkbox></el-form-item>
      <el-form-item><el-button type="primary" native-type="submit" :loading="loading">注册</el-button></el-form-item>
    </el-form>
    <el-link @click="goToLogin">已有账号？去登录</el-link>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElForm, ElInput, ElButton, ElFormItem, ElCheckbox, ElLink, ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { AuthService } from '@/services/AuthService'; // Assuming direct service usage

const router = useRouter();
const registerFormRef = ref<FormInstance>();
const loading = ref(false);
const registerForm = reactive({ username: '', email: '', password: '', confirmPassword: '', agreement: false });

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === '') callback(new Error('请再次输入密码'));
  else if (value !== registerForm.password) callback(new Error('两次输入的密码不一致'));
  else callback();
};
const registerRules = reactive<FormRules>({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }, { min: 3, message: '用户名至少3位', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '请输入有效邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请确认密码', trigger: 'blur' }, { validator: validateConfirmPassword, trigger: 'blur' }],
  agreement: [{ validator: (rule, value, cb) => value ? cb() : cb(new Error('请同意用户协议')), trigger: 'change' }]
});

const submitRegister = async () => {
  if (!registerFormRef.value) return;
  await registerFormRef.value.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    try {
      await AuthService.register({ // Direct call to service
        name: registerForm.username, // Assuming 'name' is required by backend, mapping from username
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
      });
      ElMessage.success('注册成功！验证邮件已发送。');
      router.push('/login');
    } catch (error: any) { ElMessage.error(error.response?.data?.message || '注册失败'); }
    finally { loading.value = false; }
  });
};

const goToLogin = () => router.push('/login');
</script>
```

### 后端实现
(1) 服务接口:使用Express框架定义了处理用户注册(/register)和登录(/login)的API路由，并将请求分发给相应的处理逻辑。
(2) 数据校验:在后端接收到请求数据后，利用Zod库进行严格的数据格式与类型校验，确保数据的有效性和安全性。
(3) 用户注册逻辑:接收到注册请求后，首先检查用户名或邮箱是否已被占用。验证通过后，使用bcrypt库对用户密码进行加盐哈希计算，将加密后的密码及其他用户信息通过PrismaORM存入数据库的用户（User）表中。
(4) 用户登录逻辑:处理登录请求时，根据用户提供的标识（用户名或邮箱）查询数据库。若用户存在，则使用bcrypt库的安全比较函数验证用户输入的密码与数据库中存储的哈希密码是否匹配。
(5) 令牌签发:密码验证成功后，后端使用jsonwebtoken(JWT)库生成一个包含用户唯一标识（如用户ID）且具有预设有效期的身份令牌（Token），并将其返回给前端。
(6) 认证中间件:开发了一个认证中间件，用于保护需要身份验证的API接口。此中间件负责从客户端请求（通常在HTTPHeader中）提取Token，并验证其签名和有效性。验证通过后，会将解析出的用户信息附加到请求上下文中，供后续业务逻辑使用；失败则返回未授权状态码。
(7) 后端示例代码：

```typescript
// src/controllers/AuthController.ts (Simplified)
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService'; // Assumed service for core logic
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sendMail } from '../utils/mailer'; // For verification email
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const EMAIL_VERIFICATION_EXPIRATION_HOURS = 24;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export class AuthController {

    // 处理用户注册请求 (Simplified)
    public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password, name, username } = req.body;
            if (!email || !password || !name || !username) {
                res.status(400).json({ message: 'Missing required fields' }); return;
            }

            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser && existingUser.isEmailVerified) {
                res.status(409).json({ message: 'Email already registered and verified' }); return;
            }

            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            const newUser = await prisma.user.create({
                data: { email, username, password: hashedPassword, name, isEmailVerified: false }
            });

            const verificationToken = uuidv4();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFICATION_EXPIRATION_HOURS);
            await prisma.emailVerificationCode.deleteMany({ where: { userId: newUser.id }}); // Clean old tokens
            await prisma.emailVerificationCode.create({
                data: { code: verificationToken, userId: newUser.id, expiresAt: expiresAt }
            });

            const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
            console.log(`Verification link (for demo): ${verificationLink}`); // Log link for demo

            res.status(201).json({ message: 'Registration successful! Verification email sent.' });

        } catch (error: any) {
             if (error.code === 'P2002') { // Unique constraint violation
                 res.status(409).json({ message: 'Email or username already exists.' });
             } else {
                 console.error('Registration Error:', error);
                 next(error);
             }
        }
    }

    // 处理用户登录请求 (Simplified - relies on AuthService)
    public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, username, password } = req.body;
             if ((!email && !username) || !password) {
                 res.status(400).json({ message: 'Identifier (Email/Username) and password are required' });
                 return;
             }

            // Delegate core logic (password check, token generation) to AuthService
            const { token, user } = await AuthService.login({ email, username, password });

            res.status(200).json({ message: 'Login successful', token, user: { id: user.id, email: user.email, username: user.username, name: user.name } }); // Return minimal user info

        } catch (error: any) {
            if (error.message === 'Invalid credentials') {
                res.status(401).json({ message: error.message });
            } else if (error.message.includes('邮箱尚未验证')) { // Email not verified
                 res.status(403).json({ message: error.message });
            } else {
                console.error('Login Error:', error);
                next(new Error('Login failed')); // Generic error
            }
        }
    }
}
```

```typescript
// src/middleware/AuthMiddleware.ts (Simplified)
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db'; // Prisma Client for DB check

// Ensure JWT_SECRET is consistent with where it's used for signing (e.g., AuthService)
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SUPER_SECRET_KEY';

// Extend Express Request type
export interface AuthenticatedRequest extends Request {
    userId?: number;
    userRole?: string;
}

export const AuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    // Check for Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role?: string; /* other payload fields */ };

        // Optional but recommended: Verify user exists in DB
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true } // Select only necessary fields
        });

        if (!user) {
            res.status(401).json({ message: 'Unauthorized: User not found' });
            return;
        }

        // Attach user info to request
        req.userId = user.id;
        req.userRole = user.role; // Use DB role for consistency

        next(); // Pass control to next middleware/handler

    } catch (error: any) {
        // Handle common JWT errors
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({ message: 'Unauthorized: Token expired' });
        } else { // Includes JsonWebTokenError, etc.
            res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
    }
};
```

## 5.2内容发现与展示模块实现
该模块负责美食帖子内容的呈现、浏览、搜索与筛选，是用户获取信息和平台价值体现的核心。

### 前端实现
(1) 内容列表渲染:首页或发现页通过Axios向后端请求帖子列表数据（支持分页加载），并使用如vue-waterfall-plugin-next等技术或自定义布局实现图片的瀑布流展示，优化视觉体验。帖子以可复用的Vue组件（PostCard）形式渲染，展示关键摘要信息。
(2) 帖子详情视图:用户点击帖子卡片后，通过VueRouter导航至详情页。该页面根据帖子ID向后端请求完整的帖子数据（包括正文、图片、作者、标签、评论等），并进行渲染。图片支持点击放大预览。
(3) 搜索与筛选交互:提供搜索框和标签云/列表。用户输入搜索词或点击标签时，前端向后端对应的搜索或筛选API发送请求，并动态展示返回的结果。
(4) 前端页面实现与示例代码：

```vue
<template>
  <div class="discover-view">
    <!-- 1. Search Bar -->
    <section class="search-section container">
      <el-input
        v-model="searchQuery"
        placeholder="搜索美食标题或描述"
        size="large"
        :prefix-icon="SearchIcon"
        clearable
        @keyup.enter="performSearch"
        @clear="handleSearchClear"
      />
    </section>

    <!-- 2. Tags Section -->
    <section class="tags-section container">
        <el-button
          v-for="tag in availableTags"
          :key="tag.id"
          round
          :type="selectedTags.includes(tag.name) ? 'primary' : ''"
          @click="handleTagClick(tag.name)"
        >
          {{ tag.name }}
        </el-button>
        <el-button
            v-if="selectedTags.length > 0"
            size="small" circle :icon="CloseIcon"
            @click="clearTagFilter" title="清除标签筛选"
        />
    </section>

    <!-- 3. Results Grid -->
    <section class="results-section container">
      <div v-if="isLoading" class="loading-indicator">加载中...</div>
      <div v-if="!isLoading && foodShowcases.length > 0" class="masonry-container">
        <div v-for="item in foodShowcases" :key="item.id" class="masonry-item">
           <img
             :src="getImageUrl(item.imageUrl)"
             :alt="item.title || '美食图片'"
             class="food-image" loading="lazy"
           >
           <div class="image-info-overlay">
               <h4>{{ item.title || '无标题' }}</h4>
           </div>
        </div>
      </div>
      <el-empty v-if="!isLoading && foodShowcases.length === 0 && !error" :description="emptyStateDescription" />
      <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { FoodTagService } from '@/services/FoodTagService';
import { AdminService } from '@/services/AdminService'; // Assuming this service fetches posts
import type { FoodShowcasePreview, Tag } from '@/types/models';
import { getImageUrl } from '@/utils/imageUrl';
import { ElInput, ElButton, ElIcon, ElEmpty, ElAlert } from 'element-plus';
import { Search as SearchIcon, Close as CloseIcon } from '@element-plus/icons-vue';

// Component State
const foodShowcases = ref<FoodShowcasePreview[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const availableTags = ref<Tag[]>([]);
const isLoadingTags = ref(false);
const selectedTags = ref<string[]>([]);
const searchQuery = ref('');

// Computed property for empty state
const emptyStateDescription = computed(() => {
    if (searchQuery.value) return `未能找到与 "${searchQuery.value}" 相关的结果`;
    if (selectedTags.value.length > 0) return `未能找到包含标签 "${selectedTags.value.join(', ')}" 的结果`;
    return '暂无美食展示';
});

// Watch for search query changes with debounce
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, (newValue, oldValue) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  if (newValue === '' && oldValue !== '') {
    handleSearchClear(); // Clear immediately
  } else if (newValue !== oldValue && newValue !== '') {
    searchDebounceTimer = setTimeout(() => performSearch(), 500);
  }
});

// Methods
const fetchAvailableTags = async () => {
  isLoadingTags.value = true;
  try {
    availableTags.value = await FoodTagService.getAllTags();
  } catch (err) {
    console.error('[DiscoverView] Failed to fetch tags:', err);
  } finally {
    isLoadingTags.value = false;
  }
};

const fetchFoodShowcases = async (params: { search?: string; tags?: string[] } = {}) => {
    if (isLoading.value) return;
    isLoading.value = true;
    error.value = null;
    try {
        const response = await AdminService.getFoodShowcases({ // Or a more appropriate service like PostService
            search: params.search,
            tags: params.tags,
            limit: 50, // Fetch a decent amount for discovery
            page: 1
        });
        foodShowcases.value = response.items;
    } catch (err: any) {
        console.error("[DiscoverView] Failed to fetch showcases:", err);
        error.value = '加载美食展示失败。';
        foodShowcases.value = [];
    } finally {
        isLoading.value = false;
    }
};

const handleTagClick = (tagName: string) => {
  const index = selectedTags.value.indexOf(tagName);
  if (index === -1) selectedTags.value.push(tagName);
  else selectedTags.value.splice(index, 1);
  searchQuery.value = ''; // Clear search when tags change
  fetchFoodShowcases({ tags: selectedTags.value.length > 0 ? selectedTags.value : undefined });
};

const clearTagFilter = () => {
    if (selectedTags.value.length > 0) {
        selectedTags.value = [];
        fetchFoodShowcases({});
    }
};

const performSearch = () => {
  selectedTags.value = []; // Clear tags when searching
  fetchFoodShowcases({ search: searchQuery.value || undefined });
};

const handleSearchClear = () => {
  selectedTags.value = [];
  fetchFoodShowcases({});
};

// Lifecycle Hooks
onMounted(() => {
    fetchFoodShowcases(); // Initial fetch
    fetchAvailableTags(); // Fetch tags
});
</script>

<style scoped lang="scss">
.discover-view { width: 100%; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 15px; }
.search-section { padding: 20px 0; }
.tags-section { padding: 15px 0; text-align: center; .tag-button { margin: 5px; } }
.results-section { padding: 20px 0; }
.loading-indicator { text-align: center; padding: 40px; font-size: 1.2rem; }
.masonry-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}
.masonry-item {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  width: 100%;
  img.food-image { display: block; width: 100%; height: auto; }
  .image-info-overlay { /* Simplified overlay styling */
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
    color: white; padding: 10px;
    h4 { margin: 0; font-size: 1rem; }
  }
}
/* Add styles for el-empty, el-alert if needed */
</style>
```

### 后端实现
(1) 数据模型:使用PrismaSchema精确定义了帖子（Post）的数据结构及其与用户（User）、标签（Tag）、评论（Comment）等其他实体的关联关系。
(2) 列表查询接口:实现了获取帖子列表的API(GET/api/posts)。该接口使用PrismaClient执行数据库查询，支持分页（控制返回数量和起始位置）、排序（如按时间降序）以及基于标签的条件过滤。查询时会选择性地包含（include）必要的关联数据（如作者昵称、头像）。
(3) 详情查询接口:实现了获取单个帖子详情的API(GET/api/posts/:postId)。根据传入的帖子ID，使用Prisma查询特定帖子记录，并包含其完整的关联数据（如评论列表及评论者信息）。
(4) 搜索接口:实现了处理搜索请求的API(GET/api/posts/search)。接收查询参数，并利用Prisma或数据库本身的搜索能力（如contains操作符或全文索引）在帖子标题和内容中进行匹配查询。
(5) 后端示例代码：

## 5.3社区互动模板
互动功能是提升用户粘性、构建社区生态的关键，主要包括评论、点赞、收藏和用户关注。

### 前端实现
(1) 评论交互:帖子详情页提供评论输入区域和评论列表展示。用户提交评论时，通过Axios将评论内容发送至后端对应接口。删除评论功能（对自己的评论或特定权限）也通过调用后端删除接口实现。
(2) 点赞/收藏操作:在帖子卡片和详情页设置点赞和收藏按钮，按钮的激活状态根据后端数据初始化。用户点击时，前端即时更新按钮视觉状态，并异步调用后端的点赞/取消点赞、收藏/取消收藏接口。
(3) 关注操作:用户主页或帖子作者信息旁提供关注/取消关注按钮。用户点击时，更新按钮状态并调用后端相应的用户关注/取关接口。
(4) 前端页面实现与示例代码：

### 后端实现
(1) 数据模型:在PrismaSchema中定义了评论（Comment）、点赞（PostLike）、收藏（PostFavorite）、用户关注（UserFollows）以及通知（Notification）等数据模型及其关联关系。
(2) 权限验证:所有涉及用户互动的API接口均通过认证中间件进行身份验证，确保操作由已登录用户发起。部分操作（如删除评论）可能还需进行额外的权限检查（如验证操作者是否为评论作者或帖子作者）。
(3) 业务逻辑实现:
1) 评论:创建评论接口接收评论内容，关联用户和帖子ID，存入数据库。删除评论接口验证权限后执行删除操作。
2) 点赞/收藏:相关接口通过检查或创建/删除数据库中的关联记录来实现点赞/收藏状态的变更。可能涉及更新帖子本身的点赞/收藏计数字段。
3) 关注:关注/取关接口负责在用户关注关系表中创建或删除对应的记录。
4) 通知生成:在评论、点赞、关注等互动操作成功执行后，后端逻辑会异步地在通知表中创建一条新记录，包含事件类型、触发者、接收者及关联内容（如帖子ID），为后续的通知推送做准备。
5) 后端示例代码：

## 5.4个人中心模块
个人中心为用户提供了管理个人档案、追踪个人活动（发布的帖子、收藏等）和进行账户设置的专属空间。

### 前端实现
(1) 页面布局与导航:设计了包含多个子模块（如我的帖子、我的收藏、关注列表、设置等）的个人中心页面结构。使用VueRouter的嵌套路由和ElementPlus的菜单或标签页组件实现内部导航。
(2) 数据展示:各子模块在加载时，通过Axios向后端请求相应的数据（如用户发布的帖子列表、收藏列表等），获取后进行列表化或卡片化展示。
(3) 信息编辑:在“账号设置”模块，表单(el-form)用于展示和修改用户的昵称、简介等信息。头像修改涉及文件上传组件(el-upload)。用户保存修改后，将更新的数据通过Axios发送至后端更新接口。
(4) 前端页面实现与示例代码：

### 后端实现
(1) 用户数据模型:数据库中的User模型存储了用户的详细信息，包括基本资料、加密密码、头像URL等。
(2) 专用API接口:定义了一系列服务于个人中心的API路由，如获取当前用户信息(GET/users/me)、获取用户发布的帖子(GET/users/me/posts)等。这些接口均受认证中间件保护。
(3) 数据查询逻辑:相关接口的处理逻辑会从认证中间件提供的请求上下文中获取当前用户ID，然后使用Prisma查询该用户的相关数据（如帖子、收藏、关注关系等）。
(4) 信息更新逻辑:实现更新用户信息的API(PUT/users/me)。该接口首先通过Zod校验输入数据的有效性。如果涉及文件上传（如头像），则先由Multer中间件处理文件存储，然后使用Prisma更新数据库中对应用户的字段。
(5) 后端示例代码：

```typescript
export class ProfileController {
    // 获取当前用户基本信息
    public static async getMyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            // The user object is attached by the authentication middleware
            if (!req.user) {
                 res.status(401).json({ message: 'User not authenticated' });
                 return;
            }
            // Fetch potentially updated/detailed profile data if needed, or just return req.user
            // For simplicity, returning the info from the token (might lack some details)
            const userProfile = await prisma.user.findUnique({ where: { id: req.user.id } });
            if (!userProfile) {
                 res.status(404).json({ message: 'User profile not found' });
                 return;
            }

            // Selectively return data - NEVER return the password hash
            res.status(200).json({
                id: userProfile.id,
                email: userProfile.email,
                username: userProfile.username,
                name: userProfile.name,
                bio: userProfile.bio,
                avatarUrl: userProfile.avatarUrl
                // Add other relevant profile fields
            });
        } catch (error) {
            next(error);
        }
    }

    // 更新当前用户信息
    public static async updateMyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                 res.status(401).json({ message: 'User not authenticated' });
                 return;
            }

            // Validate input using Zod (adjust schema as needed)
            const updateSchema = z.object({
                name: z.string().min(1).optional(),
                bio: z.string().optional(),
                // Add other updatable fields
            });

            const validationResult = updateSchema.safeParse(req.body);
            if (!validationResult.success) {
                 res.status(400).json({ message: 'Invalid input data', errors: validationResult.error.flatten() });
                 return;
            }

            const updateData = validationResult.data;

            // Handle avatar upload if present
            if (req.file) {
                // `req.file.path` contains the path where Multer saved the file
                // Convert to relative path suitable for URLs if needed
                // WARNING: Naive path replacement, consider a more robust approach
                const relativePath = req.file.path.replace(/\\/g, '/').split('/public/').pop();
                if (relativePath) {
                    updateData.avatarUrl = `/uploads/avatars/${relativePath.split('/').pop()}`; // Construct URL path
                }
            }

            const updatedUser = await prisma.user.update({
                where: { id: req.user.id },
                data: updateData,
            });

            // Return updated (and safe) user info
            res.status(200).json({
                message: 'Profile updated successfully',
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    username: updatedUser.username,
                    name: updatedUser.name,
                    bio: updatedUser.bio,
                    avatarUrl: updatedUser.avatarUrl
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // 获取指定用户的公开信息
    public static async getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = parseInt(req.params.userId, 10);
            if (isNaN(userId)) {
                 res.status(400).json({ message: 'Invalid user ID' });
                 return;
            }

            const userProfile = await prisma.user.findUnique({
                where: { id: userId },
                select: { // Explicitly select only public fields
                    id: true,
                    username: true,
                    name: true,
                    bio: true,
                    avatarUrl: true,
                    createdAt: true,
                    // Include counts or other relevant public info
                     _count: {
                        select: { posts: true, followers: true, following: true }
                     }
                }
            });

            if (!userProfile) {
                 res.status(404).json({ message: 'User not found' });
                 return;
            }

            res.status(200).json(userProfile);
        } catch (error) {
            next(error);
        }
    }
}
```

### 2.3.3 数据流与交互
(1) 查看自己信息：用户点击“我的主页” -> 前端发送 GET `/api/profile/me` (带JWT) -> 后端AuthMiddleware验证JWT -> ProfileController查询数据库 -> 返回用户信息 -> 前端展示。
(2) 更新信息：用户修改表单 -> 点击“保存” -> 前端发送 PUT `/api/profile/me` (带JWT和表单数据/头像文件) -> 后端AuthMiddleware验证JWT -> Multer处理文件（若有）-> ProfileController验证数据 -> 更新数据库 -> 返回成功信息 -> 前端提示成功。
(3) 查看他人信息：用户访问 `/user/123` -> 前端根据路由参数发送 GET `/api/profile/123` -> 后端ProfileController查询数据库 -> 返回用户公开信息 -> 前端展示。
