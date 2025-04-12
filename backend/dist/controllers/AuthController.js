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
exports.AuthController = void 0;
const AuthService_1 = require("../services/AuthService");
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const mailer_1 = require("../utils/mailer");
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
const prisma = new client_1.PrismaClient();
const SALT_ROUNDS = 10;
const CODE_EXPIRATION_MINUTES = 10; // Assuming this constant is defined in the code
const EMAIL_VERIFICATION_EXPIRATION_HOURS = 24; // Set expiration time for email verification
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'; // Get frontend URL from env
class AuthController {
    // 处理用户注册请求
    static register(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const { email, password, name, username } = req.body;
                // Input validation (add username validation)
                if (!email || !password || !name || !username) {
                    res.status(400).json({ message: 'Email, password, name, and username are required' });
                    return;
                }
                // Add more specific validation if needed (e.g., email format, password strength, username format/length)
                if (typeof username !== 'string' || username.length < 3) { // Example username validation
                    res.status(400).json({ message: 'Username must be a string of at least 3 characters' });
                    return;
                }
                // Check if email already exists and is verified (optional: allow re-register if not verified?)
                const existingUser = yield prisma.user.findUnique({ where: { email } });
                if (existingUser && existingUser.isEmailVerified) {
                    res.status(409).json({ message: '该邮箱已被注册并验证' });
                    return;
                }
                // Handle case where user exists but is not verified (e.g., delete old user or resend code)
                // For simplicity, we'll proceed and potentially overwrite/create a new verification code
                if (existingUser && !existingUser.isEmailVerified) {
                    // Optionally delete the unverified user record first
                    // await prisma.user.delete({ where: { id: existingUser.id }});
                    console.warn(`[AuthController.register] Email ${email} exists but is not verified. Proceeding with registration and new verification.`);
                }
                // Hash password
                const hashedPassword = yield bcrypt_1.default.hash(password, SALT_ROUNDS);
                // Create user (包含 username)
                const newUser = yield prisma.user.create({
                    data: {
                        email,
                        username,
                        password: hashedPassword,
                        name,
                        isEmailVerified: false // Start as not verified
                    }
                });
                // Generate verification token (UUID is generally better than random numbers)
                const verificationToken = (0, uuid_1.v4)();
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFICATION_EXPIRATION_HOURS);
                // Store verification token (delete any previous ones for this user)
                yield prisma.emailVerificationCode.deleteMany({ where: { userId: newUser.id } });
                yield prisma.emailVerificationCode.create({
                    data: {
                        code: verificationToken,
                        userId: newUser.id,
                        expiresAt: expiresAt
                    }
                });
                // Send verification email
                const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
                const mailSubject = '欢迎注册！请验证您的邮箱地址';
                const mailText = `感谢您的注册！请点击以下链接验证您的邮箱地址：\n${verificationLink}\n\n该链接将在 ${EMAIL_VERIFICATION_EXPIRATION_HOURS} 小时后失效。`;
                const mailHtml = `<p>感谢您的注册！</p><p>请点击以下链接验证您的邮箱地址：</p><p><a href="${verificationLink}">${verificationLink}</a></p><p>该链接将在 <strong>${EMAIL_VERIFICATION_EXPIRATION_HOURS} 小时</strong>后失效。</p>`;
                const mailSent = yield (0, mailer_1.sendMail)({
                    to: newUser.email,
                    subject: mailSubject,
                    text: mailText,
                    html: mailHtml
                });
                if (!mailSent) {
                    // Log error but still inform user to check email potentially
                    console.error(`[AuthController.register] Failed to send verification email to ${newUser.email}`);
                    // Consider what to do here: maybe delete the user? Or let them try verifying later?
                    // For now, return a success message but maybe log the failure internally.
                }
                // Print Ethereal preview URL if available
                if (typeof mailSent === 'string' && mailSent.includes('ethereal.email')) {
                    console.log(`[AuthController.register] Ethereal preview URL: ${mailSent}`);
                }
                // IMPORTANT: Do NOT return user data or token here.
                res.status(201).json({ message: '注册成功！验证邮件已发送至您的邮箱，请查收并点击链接激活账号。' });
            }
            catch (error) {
                // Handle potential errors like unique constraint violation if email exists
                if (error.code === 'P2002' && ((_b = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.includes('email'))) {
                    res.status(409).json({ message: '该邮箱已被注册' });
                }
                else {
                    console.error('Registration Error:', error);
                    // Pass to global error handler or return generic message
                    next(error);
                    // res.status(500).json({ message: '注册过程中发生错误' });
                }
            }
        });
    }
    // 处理用户登录请求 (Simplified)
    static login(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 1. Extract credentials from request body
                const { email, username, password } = req.body;
                // 2. Call AuthService.login (it handles validation and logic)
                const { token, user } = yield AuthService_1.AuthService.login({ email, username, password });
                // 3. Send successful response
                res.status(200).json({ message: 'Login successful', token, user });
            }
            catch (error) {
                // 4. Handle errors from AuthService
                console.error('Login Controller Error:', error.message); // Log the specific error message
                if (error.message === 'Username or Email is required for login' || error.message === 'Password is required for login') {
                    res.status(400).json({ message: error.message });
                }
                else if (error.message === 'Invalid credentials') {
                    res.status(401).json({ message: error.message }); // Unauthorized
                }
                else if (error.message.includes('邮箱尚未验证')) { // Check specific verification message
                    res.status(403).json({ message: error.message }); // Forbidden
                }
                else {
                    // Pass other errors to the global error handler or return 500
                    // next(error); 
                    res.status(500).json({ message: 'Internal server error during login' });
                }
            }
        });
    }
    // 处理密码重置请求
    static resetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, code, newPassword, confirmPassword } = req.body;
            // 1. 基本输入验证
            if (!email || !code || !newPassword || !confirmPassword) {
                res.status(400).json({ message: '缺少必要的字段 (email, code, newPassword, confirmPassword)' });
                return;
            }
            if (newPassword !== confirmPassword) {
                res.status(400).json({ message: '新密码和确认密码不匹配' });
                return;
            }
            // 可添加密码复杂度校验
            if (newPassword.length < 6) { // 示例：最短6位
                res.status(400).json({ message: '新密码长度至少需要6位' });
                return;
            }
            try {
                // 2. 查找用户
                const user = yield prisma.user.findUnique({ where: { email } });
                if (!user) {
                    // 为安全起见，不明确提示邮箱是否存在
                    res.status(400).json({ message: '无效的验证码或邮箱' });
                    return;
                }
                // 3. 查找并验证验证码
                const resetCodeRecord = yield prisma.passwordResetCode.findUnique({
                    where: {
                        userId_code: {
                            userId: user.id,
                            code: code
                        }
                    }
                });
                if (!resetCodeRecord) {
                    res.status(400).json({ message: '无效的验证码或邮箱' });
                    return;
                }
                // 4. 检查验证码是否过期
                const now = new Date();
                if (now > resetCodeRecord.expiresAt) {
                    // 删除过期的验证码
                    yield prisma.passwordResetCode.delete({ where: { id: resetCodeRecord.id } });
                    res.status(400).json({ message: '验证码已过期，请重新请求' });
                    return;
                }
                // 5. 验证通过，哈希新密码并更新用户
                const hashedPassword = yield bcrypt_1.default.hash(newPassword, SALT_ROUNDS);
                yield prisma.user.update({
                    where: { id: user.id },
                    data: { password: hashedPassword }
                });
                // 6. 删除已使用的验证码
                yield prisma.passwordResetCode.delete({ where: { id: resetCodeRecord.id } });
                res.status(200).json({ message: '密码重置成功，您现在可以使用新密码登录' });
            }
            catch (error) {
                console.error('Password Reset Error:', error);
                res.status(500).json({ message: '密码重置过程中发生错误' });
            }
        });
    }
    /**
     * 公开接口：发送密码重置验证码到指定邮箱
     */
    static sendPublicPasswordResetCode(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ message: '必须提供邮箱地址' });
                return;
            }
            try {
                // 1. 查找用户是否存在
                const user = yield prisma.user.findUnique({ where: { email } });
                if (!user) {
                    // 出于安全考虑，即使邮箱不存在，也返回成功信息，避免暴露注册邮箱
                    console.warn(`[AuthController.sendPublicPasswordResetCode] Email not found, but returning success: ${email}`);
                    res.status(200).json({ message: '如果邮箱已注册，验证码将发送至您的邮箱' });
                    return;
                }
                // 2. 生成验证码和过期时间 (与 UserController 类似)
                const code = crypto_1.default.randomInt(100000, 999999).toString();
                const expiresAt = new Date();
                expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRATION_MINUTES); // 使用之前定义的常量
                // 3. 存储验证码 (先删除旧的)
                yield prisma.passwordResetCode.deleteMany({ where: { userId: user.id } });
                yield prisma.passwordResetCode.create({
                    data: {
                        code: code,
                        userId: user.id,
                        expiresAt: expiresAt,
                    }
                });
                // 4. 发送邮件 (与 UserController 类似)
                const mailSubject = '重置您的密码';
                const mailText = `您的密码重置验证码是： ${code}\n\n该验证码将在 ${CODE_EXPIRATION_MINUTES} 分钟后过期。如果您没有请求重置密码，请忽略此邮件。`;
                const mailHtml = `<p>您的密码重置验证码是： <strong>${code}</strong></p><p>该验证码将在 <strong>${CODE_EXPIRATION_MINUTES} 分钟</strong>后过期。如果您没有请求重置密码，请忽略此邮件。</p>`;
                const mailSent = yield (0, mailer_1.sendMail)({
                    to: user.email,
                    subject: mailSubject,
                    text: mailText,
                    html: mailHtml,
                });
                if (!mailSent) {
                    console.error(`[AuthController.sendPublicPasswordResetCode] Failed to send email to ${user.email}`);
                    // 即使邮件发送失败，也返回通用成功信息
                    res.status(200).json({ message: '验证码发送请求处理完成' });
                    // 或者返回500？取决于策略，但通常不暴露内部错误
                    // res.status(500).json({ message: '发送验证码时发生内部错误' });
                    return;
                }
                // 打印预览 URL (如果使用 Ethereal)
                if (typeof mailSent === 'string' && mailSent.includes('ethereal.email')) {
                    console.log(`[AuthController.sendPublicPasswordResetCode] Ethereal preview URL: ${mailSent}`);
                }
                res.status(200).json({ message: '如果邮箱已注册，验证码将发送至您的邮箱' });
            }
            catch (error) {
                console.error('[AuthController.sendPublicPasswordResetCode] Error:', error);
                // 避免暴露过多信息，返回通用消息
                res.status(500).json({ message: '处理请求时发生错误' });
                // next(error); // 或者传递给全局错误处理器，但可能暴露细节
            }
        });
    }
    /**
     * 处理邮箱验证请求
     */
    static verifyEmail(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { token } = req.query; // Get token from query parameters
            if (!token || typeof token !== 'string') {
                res.status(400).json({ message: '无效或缺失的验证 Token' });
                return;
            }
            try {
                // 1. 查找验证 Token 记录
                const verificationRecord = yield prisma.emailVerificationCode.findUnique({
                    where: { code: token },
                    include: { user: true } // Include user data to update
                });
                if (!verificationRecord) {
                    res.status(400).json({ message: '无效或已使用的验证链接' });
                    return;
                }
                // 2. 检查 Token 是否过期
                const now = new Date();
                if (now > verificationRecord.expiresAt) {
                    // Optionally delete expired code, and maybe the unverified user?
                    yield prisma.emailVerificationCode.delete({ where: { id: verificationRecord.id } });
                    // Consider user experience: maybe allow resending verification?
                    res.status(400).json({ message: '验证链接已过期，请重新注册或请求发送验证邮件' });
                    return;
                }
                // 3. 验证成功，更新用户状态
                if (!verificationRecord.user) {
                    // Should not happen due to schema relations, but good practice to check
                    console.error(`[AuthController.verifyEmail] Verification record ${verificationRecord.id} has no associated user.`);
                    yield prisma.emailVerificationCode.delete({ where: { id: verificationRecord.id } }); // Clean up invalid record
                    res.status(500).json({ message: '处理验证时发生错误' });
                    return;
                }
                yield prisma.user.update({
                    where: { id: verificationRecord.userId },
                    data: { isEmailVerified: true }
                });
                // 4. 删除已使用的验证码
                yield prisma.emailVerificationCode.delete({ where: { id: verificationRecord.id } });
                // 5. 返回成功响应 (可以重定向到前端登录页或成功提示页)
                // For API response, just send success message. Redirect handled by frontend.
                res.status(200).json({ message: '邮箱验证成功！您现在可以登录了。' });
            }
            catch (error) {
                console.error('[AuthController.verifyEmail] Error:', error);
                next(error); // Pass to global error handler
            }
        });
    }
    /**
     * 公开接口：重新发送邮箱验证邮件
     */
    static resendVerificationEmail(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ message: '必须提供邮箱地址' });
                return;
            }
            try {
                // 1. 查找用户
                const user = yield prisma.user.findUnique({ where: { email } });
                if (!user || user.isEmailVerified) {
                    // 用户不存在或已验证，都返回通用成功信息
                    console.warn(`[AuthController.resendVerificationEmail] User not found or already verified for email: ${email}`);
                    res.status(200).json({ message: '如果该邮箱已注册且尚未验证，我们将重新发送验证邮件。' });
                    return;
                }
                // 2. 用户存在且未验证，生成新 Token 并发送邮件 (逻辑同 register)
                const verificationToken = (0, uuid_1.v4)();
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFICATION_EXPIRATION_HOURS); // Use existing constant
                // 更新或创建验证码 (先删除旧的)
                yield prisma.emailVerificationCode.deleteMany({ where: { userId: user.id } });
                yield prisma.emailVerificationCode.create({
                    data: {
                        code: verificationToken,
                        userId: user.id,
                        expiresAt: expiresAt
                    }
                });
                // 发送邮件
                const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
                const mailSubject = '请重新验证您的邮箱地址';
                const mailText = `请点击以下链接以验证您的邮箱地址：\n${verificationLink}\n\n该链接将在 ${EMAIL_VERIFICATION_EXPIRATION_HOURS} 小时后失效。`;
                const mailHtml = `<p>请点击以下链接以验证您的邮箱地址：</p><p><a href="${verificationLink}">${verificationLink}</a></p><p>该链接将在 <strong>${EMAIL_VERIFICATION_EXPIRATION_HOURS} 小时</strong>后失效。</p>`;
                const mailSent = yield (0, mailer_1.sendMail)({
                    to: user.email,
                    subject: mailSubject,
                    text: mailText,
                    html: mailHtml
                });
                if (!mailSent) {
                    console.error(`[AuthController.resendVerificationEmail] Failed to resend verification email to ${user.email}`);
                    // 即使发送失败，也返回成功信息，避免暴露问题
                }
                // 打印预览 URL
                if (typeof mailSent === 'string' && mailSent.includes('ethereal.email')) {
                    console.log(`[AuthController.resendVerificationEmail] Ethereal preview URL: ${mailSent}`);
                }
                res.status(200).json({ message: '如果该邮箱已注册且尚未验证，我们将重新发送验证邮件。' });
            }
            catch (error) {
                console.error('[AuthController.resendVerificationEmail] Error:', error);
                next(error);
            }
        });
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map