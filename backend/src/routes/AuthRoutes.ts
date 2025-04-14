import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

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

export default router;