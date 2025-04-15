import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import LoginView from '@/views/auth/LoginView.vue'
import { useUserStore } from '@/stores/modules/user'
import type { RouteRecordRaw } from 'vue-router'

// Import the Admin layout
import AdminLayout from '@/components/layout/AdminLayout.vue';

// Correct the import path using @ alias
import UnderDevelopment from '@/views/admin/common/UnderDevelopment.vue'
import PostDetailView from '@/views/post/PostDetailView.vue'
import RegisterView from '@/views/auth/RegisterView.vue';
import ResetPasswordView from '@/views/auth/ResetPasswordView.vue';
import VerifyEmailView from '@/views/auth/VerifyEmailView.vue';

// Ensure guards import is commented out if it causes errors
// import { requireAuth, requireAdmin } from './guards'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/HomeView.vue')
      },
      {
        path: '/about',
        name: 'about',
        component: () => import('@/views/AboutView.vue'),
      },
      {
        path: '/discover',
        name: 'Discover',
        component: () => import('@/views/DiscoverView.vue')
      },
      {
        path: '/community',
        name: 'Community',
        component: () => import('@/views/CommunityView.vue')
      },
      // Removed the old Personal Center Routes group
    ]
  },
  {
    path: '/posts/:id',
    component: MainLayout,
    children: [
        {
            path: '',
            name: 'PostDetail',
            component: PostDetailView,
            props: true
        }
    ]
  },
  {
    path: '/post/create',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'CreatePost',
        component: () => import('@/views/post/CreatePostView.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/post/edit/:id',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'EditPost',
        component: () => import('@/views/post/EditPostView.vue'),
        props: true,
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresGuest: true }
  },
   {
     path: '/register',
     name: 'Register',
     component: () => import('@/views/auth/RegisterView.vue'),
     meta: { requiresGuest: true }
   },
   {
     path: '/reset-password',
     name: 'ResetPassword',
     component: ResetPasswordView,
     meta: { requiresGuest: true }
   },
   {
     path: '/verify-email',
     name: 'VerifyEmail',
     component: VerifyEmailView,
     meta: { requiresGuest: true }
   },
  // Keep the User Profile route
  {
    path: '/user/:userId',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'UserProfile',
        component: () => import('@/views/profile/UserProfileView.vue'), // Point to the new component
        props: true
      }
    ],
    meta: { requiresAuth: false }
  },
  // Add new Settings route group
  {
    path: '/settings',
    component: MainLayout,
    meta: { requiresAuth: true }, // Settings require login
    redirect: '/settings/profile', // Default redirect to profile editing
    children: [
      {
        path: 'profile',
        name: 'EditProfile',
        component: () => import('@/views/settings/EditProfileView.vue')
      },
      {
        path: 'account',
        name: 'AccountSettings',
        component: () => import('@/views/PersonalCenter/AccountSettings.vue') // Corrected import path
      },
      // Add the Notifications route here
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/PersonalCenter/NotificationsView.vue')
      },
      // Add My Posts route
      {
        path: 'my-posts',
        name: 'MyPosts',
        component: () => import('@/views/PersonalCenter/MyPostsView.vue')
      },
      // Add My Favorites route
      {
        path: 'my-favorites',
        name: 'MyFavorites',
        component: () => import('@/views/PersonalCenter/MyFavoritesView.vue')
      }
    ]
  },
  // Add Admin Routes
  {
    path: '/admin',
    component: AdminLayout,
    // meta: { requiresAuth: true }, // Ensure guards are handled globally or fix import
    redirect: { name: 'AdminDashboard' }, // 添加重定向到仪表盘
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/DashboardView.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'food-management',
        name: 'AdminFoodManagement',
        component: () => import('@/views/admin/FoodManagementView.vue'),
        meta: { title: '美食图片管理' }
      },
      // Added routes pointing to the placeholder
      {
        path: 'posts',
        name: 'AdminPosts',
        component: UnderDevelopment
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: UnderDevelopment,
        meta: { requiresAuth: true, isAdmin: true }
      },
      {
        path: 'tags',
        name: 'AdminTagManagement',
        component: () => import('@/views/admin/TagManagementView.vue'),
        meta: { requiresAuth: true, isAdmin: true, title: '标签管理' }
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: UnderDevelopment,
        meta: { requiresAuth: true, isAdmin: true }
      },
      {
        path: 'other',
        name: 'AdminOther',
        component: UnderDevelopment
      }
    ]
  },
  // Removed the separate /profile/:id? route as it's handled under /personal-center now
  // {
  //   path: '/profile/:id?',
  //   name: 'UserProfile',
  //   component: UserProfileView,
  //   props: true
  // },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 启用路由守卫以保护需要认证的路由
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const isLoggedIn = userStore.isLoggedIn;
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !isLoggedIn) {
    // 如果路由需要认证但用户未登录，重定向到登录页面
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else if ((to.name === 'Login' || to.name === 'Register') && isLoggedIn) {
    // 如果用户已登录但尝试访问登录或注册页面，重定向到首页
    next('/');
  } else {
    // 其他情况正常导航
    next();
  }
})

export default router
