"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController"); // 导入整个类
const FavoriteController_1 = require("../controllers/FavoriteController");
const NotificationController_1 = require("../controllers/NotificationController");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const multerConfig_1 = __importDefault(require("../config/multerConfig"));
// console.log('[UserRoutes.ts] File executing...'); // Remove log
const userRouter = (0, express_1.Router)();
exports.userRouter = userRouter;
// Public routes (if any specific user routes need to be public)
// router.get('/:id', UserController.getUserById); // Example public route
// --- Get Default Avatars (Public) ---
userRouter.get('/avatars/defaults', UserController_1.UserController.getDefaultAvatars);
// Routes requiring authentication
userRouter.use(AuthMiddleware_1.AuthMiddleware); // Apply auth middleware to all subsequent routes in this file
// 定义用户路由
// GET /api/users/me - 获取当前用户信息
// 应用 AuthMiddleware 来保护这个路由
userRouter.get('/me', UserController_1.UserController.getCurrentUser); // 使用 getCurrentUser
// GET /api/users/me/favorites - 获取当前用户的收藏列表 (需要认证)
userRouter.get('/me/favorites', FavoriteController_1.FavoriteController.getMyFavorites);
// GET /api/users/me/posts - 获取当前用户的帖子列表 (Re-apply definition)
userRouter.get('/me/posts', UserController_1.UserController.getMyPosts);
// GET /api/users/me/notifications - 获取当前用户的通知列表
userRouter.get('/me/notifications', NotificationController_1.NotificationController.getNotifications);
// --- REMOVE OBSOLETE ROUTE --- 
// PUT /api/users/profile - 更新当前用户个人资料 (需要认证)
// userRouter.put('/profile', UserController.updateProfile);
// --- END REMOVE --- 
// 更新当前用户信息 (用于设置预设头像或修改名字等)
userRouter.put('/me/profile', UserController_1.UserController.updateUserProfile);
// 上传头像
userRouter.post('/me/avatar', multerConfig_1.default.single('avatar'), UserController_1.UserController.uploadAvatar);
// 新增：发送密码重置验证码 (需要认证)
userRouter.post('/me/send-password-reset-code', UserController_1.UserController.sendPasswordResetCode);
// PUT /api/users/me/password - 修改当前用户密码 (新增)
userRouter.put('/me/password', UserController_1.UserController.changePassword);
// --- 获取用户其他关联数据的路由占位符 (未来实现) ---
// userRouter.get('/me/favorites', AuthMiddleware, UserController.getUserFavorites); // <-- 删除或注释掉这个重复的定义
userRouter.get('/me/posts', UserController_1.UserController.getUserPosts);
userRouter.get('/me/notifications', UserController_1.UserController.getUserNotifications);
// --- 结束占位符 ---
// 获取所有用户 (示例，可能需要权限控制)
userRouter.get('/', UserController_1.UserController.getAllUsers);
// 获取特定用户信息 (公开信息或登录用户自己的信息)
// 注意：此路由需要更新以包含关注状态和计数
userRouter.get('/:userId', UserController_1.UserController.getUserById);
// 更新当前登录用户信息 (例如用户名、个人简介)
// 注意：这条路由似乎与 /me/profile 重复，可能需要移除
// userRouter.put('/profile', AuthMiddleware, UserController.updateUserProfile);
// 更新当前登录用户头像
// 注意：这条路由似乎与 /me/avatar 重复，且使用了不推荐的 PUT 方法上传文件
// 正确的方式应是使用 POST 到 /me/avatar
// 因此注释掉此路由
// userRouter.put('/profile/avatar', AuthMiddleware, upload.single('avatar'), UserController.uploadAvatar);
// 删除用户 (通常需要管理员权限)
userRouter.delete('/:userId', UserController_1.UserController.deleteUser); // AuthMiddleware 已应用
// --- 新增关注/取关路由 (AuthMiddleware 已应用) ---
userRouter.post('/:userId/follow', UserController_1.UserController.followUser);
userRouter.delete('/:userId/follow', UserController_1.UserController.unfollowUser);
userRouter.get('/:userId/followers', UserController_1.UserController.getFollowers);
userRouter.get('/:userId/following', UserController_1.UserController.getFollowing);
//# sourceMappingURL=UserRoutes.js.map