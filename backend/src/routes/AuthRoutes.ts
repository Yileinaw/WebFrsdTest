import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();

// 定义认证路由
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/send-password-reset-code', AuthController.sendPublicPasswordResetCode);
router.post('/reset-password', AuthController.resetPassword);
router.get('/verify-email', AuthController.verifyEmail);
router.post('/resend-verification', AuthController.resendVerificationEmail);

export default router; 