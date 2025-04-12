// src/controllers/AuthController.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sendMail } from '../utils/mailer';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { AuthMiddleware } from '../middleware/AuthMiddleware'; // Correct the import name and casing

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const CODE_EXPIRATION_MINUTES = 10; // Assuming this constant is defined in the code
const EMAIL_VERIFICATION_EXPIRATION_HOURS = 24; // Set expiration time for email verification
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'; // Get frontend URL from env

export class AuthController {
    // 处理用户注册请求
    public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password, name, username } = req.body;
            if (!email || !password || !name || !username) {
                res.status(400).json({ message: 'Email, password, name, and username are required' });
                return;
            }
            if (typeof username !== 'string' || username.length < 3) {
                 res.status(400).json({ message: 'Username must be a string of at least 3 characters' });
                 return;
             }

            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser && existingUser.isEmailVerified) {
                 res.status(409).json({ message: '该邮箱已被注册并验证' });
                 return;
            } 
            if (existingUser && !existingUser.isEmailVerified) {
                console.warn(`[AuthController.register] Email ${email} exists but is not verified. Proceeding with registration and new verification.`);
            }

            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            const newUser = await prisma.user.create({
                data: {
                    email,
                    username,
                    password: hashedPassword,
                    name,
                    isEmailVerified: false // Start as not verified
                }
            });

            const verificationToken = uuidv4(); 
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFICATION_EXPIRATION_HOURS);

            await prisma.emailVerificationCode.deleteMany({ where: { userId: newUser.id }});
            await prisma.emailVerificationCode.create({
                data: {
                    code: verificationToken,
                    userId: newUser.id,
                    expiresAt: expiresAt
                }
            });

            const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
            const mailSubject = '欢迎注册！请验证您的邮箱地址';
            const mailText = `感谢您的注册！请点击以下链接验证您的邮箱地址：\n${verificationLink}\n\n该链接将在 ${EMAIL_VERIFICATION_EXPIRATION_HOURS} 小时后失效。`;
            const mailHtml = `<p>感谢您的注册！</p><p>请点击以下链接验证您的邮箱地址：</p><p><a href="${verificationLink}">${verificationLink}</a></p><p>该链接将在 <strong>${EMAIL_VERIFICATION_EXPIRATION_HOURS} 小时</strong>后失效。</p>`;

            const mailSent = await sendMail({
                to: newUser.email,
                subject: mailSubject,
                text: mailText,
                html: mailHtml
            });

            if (!mailSent) {
                console.error(`[AuthController.register] Failed to send verification email to ${newUser.email}`);
            }
            
            if (typeof mailSent === 'string' && mailSent.includes('ethereal.email')) {
                console.log(`[AuthController.register] Ethereal preview URL: ${mailSent}`);
            }

            res.status(201).json({ message: '注册成功！验证邮件已发送至您的邮箱，请查收并点击链接激活账号。' });

        } catch (error: any) {
            if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
                 res.status(409).json({ message: '该邮箱已被注册' });
             } 
             else if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
                  res.status(409).json({ message: '该用户名已被使用' });
             } else {
                console.error('Registration Error:', error);
                next(error);
            }
        }
    }

    // 处理用户登录请求
    public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, username, password } = req.body;

            const { token, user } = await AuthService.login({ email, username, password });
            
            res.status(200).json({ message: 'Login successful', token, user });

        } catch (error: any) {
                console.error('Login Controller Error:', error.message); 
                if (error.message === 'Username or Email is required for login' || error.message === 'Password is required for login') {
                    res.status(400).json({ message: error.message });
                } else if (error.message === 'Invalid credentials') {
                    res.status(401).json({ message: error.message }); 
                } else if (error.message.includes('邮箱尚未验证')) {
                    res.status(403).json({ message: error.message }); 
                } else {
                    res.status(500).json({ message: 'Internal server error during login' });
                }
        }
    }

    // 处理密码重置请求
    public static async resetPassword(req: Request, res: Response): Promise<void> {
        const { email, code, newPassword, confirmPassword } = req.body;

        if (!email || !code || !newPassword || !confirmPassword) {
            res.status(400).json({ message: '缺少必要的字段 (email, code, newPassword, confirmPassword)' });
            return;
        }
        if (newPassword !== confirmPassword) {
            res.status(400).json({ message: '新密码和确认密码不匹配' });
            return;
        }
        if (newPassword.length < 6) {
             res.status(400).json({ message: '新密码长度至少需要6位' });
             return;
        }

        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                res.status(400).json({ message: '无效的验证码或邮箱' });
                return;
            }

            const resetCodeRecord = await prisma.passwordResetCode.findUnique({
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

            const now = new Date();
            if (now > resetCodeRecord.expiresAt) {
                await prisma.passwordResetCode.delete({ where: { id: resetCodeRecord.id } });
                res.status(400).json({ message: '验证码已过期，请重新请求' });
                return;
            }

            const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });

            await prisma.passwordResetCode.delete({ where: { id: resetCodeRecord.id } });

            res.status(200).json({ message: '密码重置成功，您现在可以使用新密码登录' });

        } catch (error: any) {
            console.error('Password Reset Error:', error);
            res.status(500).json({ message: '密码重置过程中发生错误' });
        }
    }

    /**
     * 公开接口：发送密码重置验证码到指定邮箱
     */
    public static async sendPublicPasswordResetCode(req: Request, res: Response, next: NextFunction): Promise<void> {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ message: '必须提供邮箱地址' });
            return;
        }

        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                console.warn(`[AuthController.sendPublicPasswordResetCode] Email not found, but returning success: ${email}`);
                res.status(200).json({ message: '如果邮箱已注册，验证码将发送至您的邮箱' });
                return;
            }

            const code = crypto.randomInt(100000, 999999).toString();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRATION_MINUTES);

            await prisma.passwordResetCode.deleteMany({ where: { userId: user.id } });
            await prisma.passwordResetCode.create({
                data: {
                    code: code,
                    userId: user.id,
                    expiresAt: expiresAt,
                }
            });

            const mailSubject = '重置您的密码';
            const mailText = `您的密码重置验证码是： ${code}\n\n该验证码将在 ${CODE_EXPIRATION_MINUTES} 分钟后过期。如果您没有请求重置密码，请忽略此邮件。`;
            const mailHtml = `<p>您的密码重置验证码是： <strong>${code}</strong></p><p>该验证码将在 <strong>${CODE_EXPIRATION_MINUTES} 分钟</strong>后过期。如果您没有请求重置密码，请忽略此邮件。</p>`;

            const mailSent = await sendMail({
                to: user.email,
                subject: mailSubject,
                text: mailText,
                html: mailHtml,
            });

            if (!mailSent) {
                console.error(`[AuthController.sendPublicPasswordResetCode] Failed to send email to ${user.email}`);
                 res.status(200).json({ message: '验证码发送请求处理完成' }); 
                return; 
            }
            
            if (typeof mailSent === 'string' && mailSent.includes('ethereal.email')) {
                console.log(`[AuthController.sendPublicPasswordResetCode] Ethereal preview URL: ${mailSent}`);
            }

            res.status(200).json({ message: '如果邮箱已注册，验证码将发送至您的邮箱' });

        } catch (error) {
            console.error('[AuthController.sendPublicPasswordResetCode] Error:', error);
            res.status(500).json({ message: '处理请求时发生错误' });
        }
    }

    /**
     * 处理邮箱验证请求
     */
    public static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            res.status(400).json({ message: '无效或缺失的验证 Token' });
            return;
        }

        try {
            const verificationRecord = await prisma.emailVerificationCode.findUnique({
                where: { code: token },
                include: { user: true }
            });

            if (!verificationRecord) {
                res.status(400).json({ message: '无效或已使用的验证链接' });
                return;
            }

            const now = new Date();
            if (now > verificationRecord.expiresAt) {
                await prisma.emailVerificationCode.delete({ where: { id: verificationRecord.id } });
                res.status(400).json({ message: '验证链接已过期，请重新注册或请求发送验证邮件' });
                return;
            }

            if (!verificationRecord.user) {
                 console.error(`[AuthController.verifyEmail] Verification record ${verificationRecord.id} has no associated user.`);
                 await prisma.emailVerificationCode.delete({ where: { id: verificationRecord.id } });
                 res.status(500).json({ message: '处理验证时发生错误' });
                 return;
            }
            
            await prisma.user.update({
                where: { id: verificationRecord.userId },
                data: { isEmailVerified: true }
            });

            await prisma.emailVerificationCode.delete({ where: { id: verificationRecord.id } });

            res.status(200).json({ message: '邮箱验证成功！您现在可以登录了。' });

        } catch (error) {
            console.error('[AuthController.verifyEmail] Error:', error);
            next(error);
        }
    }

    /**
     * 公开接口：重新发送邮箱验证邮件
     */
    public static async resendVerificationEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ message: '必须提供邮箱地址' });
            return;
        }

        try {
            const user = await prisma.user.findUnique({ where: { email } });

            if (!user || user.isEmailVerified) {
                console.warn(`[AuthController.resendVerificationEmail] User not found or already verified for email: ${email}`);
                res.status(200).json({ message: '如果该邮箱已注册且尚未验证，我们将重新发送验证邮件。' });
                return;
            }

            const verificationToken = uuidv4();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFICATION_EXPIRATION_HOURS);

            await prisma.emailVerificationCode.deleteMany({ where: { userId: user.id } });
            await prisma.emailVerificationCode.create({
                data: {
                    code: verificationToken,
                    userId: user.id,
                    expiresAt: expiresAt
                }
            });

            const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
            const mailSubject = '请重新验证您的邮箱地址';
            const mailText = `请点击以下链接以验证您的邮箱地址：\n${verificationLink}\n\n该链接将在 ${EMAIL_VERIFICATION_EXPIRATION_HOURS} 小时后失效。`;
            const mailHtml = `<p>请点击以下链接以验证您的邮箱地址：</p><p><a href="${verificationLink}">${verificationLink}</a></p><p>该链接将在 <strong>${EMAIL_VERIFICATION_EXPIRATION_HOURS} 小时</strong>后失效。</p>`;

            const mailSent = await sendMail({
                to: user.email,
                subject: mailSubject,
                text: mailText,
                html: mailHtml
            });
            
            if (!mailSent) {
                console.error(`[AuthController.resendVerificationEmail] Failed to resend verification email to ${user.email}`);
            }
            
            if (typeof mailSent === 'string' && mailSent.includes('ethereal.email')) {
                 console.log(`[AuthController.resendVerificationEmail] Ethereal preview URL: ${mailSent}`);
            }

            res.status(200).json({ message: '如果该邮箱已注册且尚未验证，我们将重新发送验证邮件。' });

        } catch (error) {
            console.error('[AuthController.resendVerificationEmail] Error:', error);
            next(error);
        }
    }

    /**
     * 获取当前登录用户的信息 (需要认证)
     */
    public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
        // @ts-ignore - Express Request types might not know about 'user' or 'userId' property added by middleware
        // Correctly access userId attached by AuthMiddleware
        const userId = req.userId; 

        if (!userId) {
            // This should theoretically not happen if AuthMiddleware passed
            console.error('[AuthController.getMe] Error: userId not found on request object after AuthMiddleware.');
            res.status(401).json({ message: '用户未认证或认证信息丢失' });
            return;
        }

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    name: true,
                    avatarUrl: true,
                    bio: true,
                    role: true,
                    isEmailVerified: true,
                    createdAt: true,
                    // Include counts using Prisma's relation count feature
                    _count: {
                        select: {
                            posts: true,
                            followers: true,
                            following: true,
                            favorites: true
                        }
                    }
                }
            });

            if (!user) {
                res.status(404).json({ message: '用户未找到' });
                return;
            }

            // Map Prisma's _count to the desired field names
            const { _count, ...userData } = user;
            const responseUser = {
                ...userData,
                postCount: _count?.posts ?? 0,
                followerCount: _count?.followers ?? 0,
                followingCount: _count?.following ?? 0,
                favoritesCount: _count?.favorites ?? 0,
                joinedAt: user.createdAt // Map createdAt to joinedAt if needed by frontend
            };

            res.status(200).json({ user: responseUser });

        } catch (error: any) {
             console.error('[AuthController.getMe] Error fetching user data:', error);
             next(error); // Pass error to global handler
        }
    }
} 