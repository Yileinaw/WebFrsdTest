"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const router = (0, express_1.Router)();
// 添加调试日志
console.log('[AuthRoutes] 初始化认证路由');
// 定义认证路由
router.post('/register', (req, res, next) => {
    console.log('[AuthRoutes] 收到注册请求');
    next();
}, AuthController_1.AuthController.register);
router.post('/login', (req, res, next) => {
    console.log('[AuthRoutes] 收到登录请求:', req.body);
    next();
}, AuthController_1.AuthController.login);
router.post('/send-password-reset-code', AuthController_1.AuthController.sendPublicPasswordResetCode);
router.post('/reset-password', AuthController_1.AuthController.resetPassword);
router.get('/verify-email', AuthController_1.AuthController.verifyEmail);
router.post('/resend-verification', AuthController_1.AuthController.resendVerificationEmail);
// Add route for getting current user info
router.get('/me', (req, res, next) => {
    console.log('[AuthRoutes] 收到获取当前用户信息请求');
    next();
}, AuthMiddleware_1.AuthMiddleware, AuthController_1.AuthController.getMe);
exports.default = router;
//# sourceMappingURL=AuthRoutes.js.map