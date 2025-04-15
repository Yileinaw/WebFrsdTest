import { Router, Response } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/AuthMiddleware';
import prisma from '../db';

const router = Router();

// 添加调试日志
console.log('[AuthRoutes] 初始化认证路由');

// 定义认证路由
router.post('/register', (req, res, next) => {
    console.log('[AuthRoutes] 收到注册请求');
    next();
}, AuthController.register);

router.post('/login', (req, res, next) => {
    console.log('[AuthRoutes] 收到登录请求:', req.body);
    next();
}, AuthController.login);

router.post('/send-password-reset-code', AuthController.sendPublicPasswordResetCode);
router.post('/reset-password', AuthController.resetPassword);
router.get('/verify-email', AuthController.verifyEmail);
router.post('/resend-verification', AuthController.resendVerificationEmail);

// Add route for getting current user info
router.get('/me', (req, res, next) => {
    console.log('[AuthRoutes] 收到获取当前用户信息请求');
    next();
}, AuthMiddleware, AuthController.getMe);

// 开发环境下的路由，用于将当前用户设置为管理员（仅开发环境使用）
if (process.env.NODE_ENV !== 'production') {
    router.post('/dev/make-admin', AuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: '未授权访问' });
            }

            // 将当前用户设置为管理员
            const updatedUser = await prisma.user.update({
                where: { id: req.userId },
                data: { role: 'ADMIN' },
                select: { id: true, username: true, email: true, role: true }
            });

            console.log(`[AuthRoutes] 开发模式: 用户 ${updatedUser.username || updatedUser.email} (用户ID: ${updatedUser.id}) 已被设置为管理员`);

            res.status(200).json({
                message: '您已被设置为管理员',
                user: updatedUser
            });
        } catch (error) {
            console.error('[AuthRoutes] 设置管理员时出错:', error);
            res.status(500).json({ message: '设置管理员时出错' });
        }
    });
}

export default router;