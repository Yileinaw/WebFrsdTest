"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const db_1 = __importDefault(require("../db"));
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
// 开发环境下的路由，用于将当前用户设置为管理员（仅开发环境使用）
if (process.env.NODE_ENV !== 'production') {
    router.post('/dev/make-admin', AuthMiddleware_1.AuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.userId) {
                return res.status(401).json({ message: '未授权访问' });
            }
            // 将当前用户设置为管理员
            const updatedUser = yield db_1.default.user.update({
                where: { id: req.userId },
                data: { role: 'ADMIN' },
                select: { id: true, username: true, email: true, role: true }
            });
            console.log(`[AuthRoutes] 开发模式: 用户 ${updatedUser.username || updatedUser.email} (用户ID: ${updatedUser.id}) 已被设置为管理员`);
            res.status(200).json({
                message: '您已被设置为管理员',
                user: updatedUser
            });
        }
        catch (error) {
            console.error('[AuthRoutes] 设置管理员时出错:', error);
            res.status(500).json({ message: '设置管理员时出错' });
        }
    }));
}
exports.default = router;
//# sourceMappingURL=AuthRoutes.js.map