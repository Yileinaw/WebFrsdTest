import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { FavoriteController } from '../controllers/FavoriteController'; // 导入 FavoriteController
import { NotificationController } from '../controllers/NotificationController'; // Import NotificationController
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/AuthMiddleware'; // 导入认证中间件和 AuthenticatedRequest
import { PostService } from '../services/PostService'; // Ensure PostService is imported if needed here (it's used in UserController)
import upload from '../config/multerConfig'; // 导入 multer 配置

// console.log('[UserRoutes.ts] File executing...'); // Remove log

const userRouter = Router();

// Public routes (if any specific user routes need to be public)
// router.get('/:id', UserController.getUserById); // Example public route

// --- Get Default Avatars (Public) ---
userRouter.get('/avatars/defaults', UserController.getDefaultAvatars);

// Routes requiring authentication
userRouter.use(AuthMiddleware); // Apply auth middleware to all subsequent routes in this file

// 定义用户路由
// GET /api/users/me - 获取当前用户信息
// 应用 AuthMiddleware 来保护这个路由
userRouter.get('/me', UserController.getCurrentUserProfile);

// GET /api/users/me/favorites - 获取当前用户的收藏列表 (需要认证)
userRouter.get('/me/favorites', FavoriteController.getMyFavorites);

// GET /api/users/me/posts - 获取当前用户的帖子列表 (Re-apply definition)
userRouter.get('/me/posts', UserController.getMyPosts);

// GET /api/users/me/notifications - 获取当前用户的通知列表
userRouter.get('/me/notifications', NotificationController.getNotifications);

// --- REMOVE OBSOLETE ROUTE --- 
// PUT /api/users/profile - 更新当前用户个人资料 (需要认证)
// userRouter.put('/profile', UserController.updateProfile);
// --- END REMOVE --- 

// 更新当前用户信息 (用于设置预设头像或修改名字等)
userRouter.put('/me/profile', UserController.updateUserProfile);

// 上传头像
userRouter.post('/me/avatar', upload.single('avatar'), UserController.uploadAvatar);

// 新增：发送密码重置验证码 (需要认证)
userRouter.post('/me/send-password-reset-code', UserController.sendPasswordResetCode);

// PUT /api/users/me/password - 修改当前用户密码 (新增)
userRouter.put('/me/password', UserController.changePassword);

// --- 获取用户其他关联数据的路由占位符 (未来实现) ---
// userRouter.get('/me/favorites', AuthMiddleware, UserController.getUserFavorites); // <-- 删除或注释掉这个重复的定义
userRouter.get('/me/posts', UserController.getUserPosts);
userRouter.get('/me/notifications', UserController.getUserNotifications);
// --- 结束占位符 ---

export { userRouter }; 