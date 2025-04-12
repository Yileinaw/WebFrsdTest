"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const router = (0, express_1.Router)();
// 定义认证路由
router.post('/register', AuthController_1.AuthController.register);
router.post('/login', AuthController_1.AuthController.login);
router.post('/send-password-reset-code', AuthController_1.AuthController.sendPublicPasswordResetCode);
router.post('/reset-password', AuthController_1.AuthController.resetPassword);
router.get('/verify-email', AuthController_1.AuthController.verifyEmail);
router.post('/resend-verification', AuthController_1.AuthController.resendVerificationEmail);
exports.default = router;
//# sourceMappingURL=AuthRoutes.js.map