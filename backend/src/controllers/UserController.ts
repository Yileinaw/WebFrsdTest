import { Response, Request, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { AuthenticatedRequest } from '../middleware/AuthMiddleware';
import { PostService } from '../services/PostService';
import { FavoriteService } from '../services/FavoriteService';
import { NotificationService } from '../services/NotificationService';
import multer from 'multer';
import fs from 'fs'; // Import fs module
import path from 'path'; // Import path module
import { PrismaClient } from '@prisma/client'; // <-- Import Prisma Client
import { sendMail } from '../utils/mailer'; // <-- Import mailer
import crypto from 'crypto'; // <-- Import crypto
import bcrypt from 'bcrypt'; // <-- Import bcrypt

// Define a type for the response of getDefaultAvatars
interface DefaultAvatarsResponse {
    avatarUrls: string[];
}

const prisma = new PrismaClient(); // <-- Instantiate Prisma Client
const CODE_EXPIRATION_MINUTES = 10; // <-- Define expiration time
const SALT_ROUNDS = 10; // Salt rounds for bcrypt

export class UserController {
    // 处理获取当前登录用户信息的请求
    public static async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.userId;
            if (!userId) {
                console.error('[UserController - getCurrentUser] Error: userId is missing');
                res.status(401).json({ message: 'Unauthorized: User ID not found after authentication' });
                return;
            }
            const user = await UserService.getUserById(userId);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.status(200).json({ user });
        } catch (error: any) {
            console.error('Get Current User Error:', error);
            res.status(500).json({ message: 'Internal server error retrieving user data' });
        }
    }

    // 处理更新用户个人资料的请求
    public static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized: User ID not found in request' });
            return;
        }
        const { name, avatarUrl } = req.body;

        // Basic validation
        if (name !== undefined && typeof name !== 'string') {
             res.status(400).json({ message: 'Name must be a string' });
             return;
        }
        if (avatarUrl !== undefined && typeof avatarUrl !== 'string') {
             res.status(400).json({ message: 'avatarUrl must be a string' });
             return;
        }
        // Add more validation for avatarUrl if needed (e.g., check if it's one of the defaults or an uploaded path)

        try {
            const updateData: { name?: string; avatarUrl?: string } = {};
            if (name !== undefined) {
                updateData.name = name;
            }
            if (avatarUrl !== undefined) { // Allow setting or removing avatar
                updateData.avatarUrl = avatarUrl; // Could be a preset URL or potentially null/empty string to remove
            }
            
            // Only update if there's data to update
            if (Object.keys(updateData).length === 0) {
                 res.status(400).json({ message: 'No update data provided' });
                 return;
            }

            const updatedUser = await UserService.updateUserProfile(userId, updateData);
            res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
        } catch (error) {
            next(error); // Pass error to the global error handler
        }
    }

    // --- Add method to get current user's posts --- 
    public static async getMyPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.userId;
            if (!userId) {
                console.error('[UserController] Error: userId is missing after AuthMiddleware');
                res.status(401).json({ message: 'Unauthorized: User ID not found' });
                return;
            }
            
            const page = parseInt(req.query.page as string) || 1; 
            const limit = parseInt(req.query.limit as string) || 10; 

            const result = await PostService.getAllPosts({ 
                page,
                limit, 
                authorId: userId,
                currentUserId: userId 
             });

            res.status(200).json(result); 

        } catch (error: any) {
            console.error('[UserController] Get My Posts Error:', error);
            res.status(500).json({ message: 'Internal server error retrieving your posts' });
        }
    }
    // --- End add method ---

    // 获取当前登录用户的信息
    public static async getCurrentUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.userId;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const user = await UserService.getUserById(userId);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.status(200).json({ user });
        } catch (error: any) {
            console.error("Get Current User Profile Error:", error);
            res.status(500).json({ message: error.message || 'Failed to get user profile' });
        }
    }
    
    // 更新用户信息（包括设置预设头像）
     public static async updateUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
             const userId = req.userId;
             const { name, avatarUrl } = req.body;
             if (!userId) {
                 res.status(401).json({ message: 'Unauthorized' });
                 return;
             }
             const profileData: { name?: string; avatarUrl?: string | null } = {};
             if (name !== undefined) profileData.name = name;
             if (avatarUrl !== undefined) {
                 if (avatarUrl === null || (typeof avatarUrl === 'string' && avatarUrl.startsWith('/static/avatars/defaults/'))) {
                    profileData.avatarUrl = avatarUrl;
                 } else {
                    console.warn(`[UserController.updateUserProfile] Invalid avatarUrl received: ${avatarUrl}. Allowed: null or starting with /static/avatars/defaults/`);
                    res.status(400).json({ message: 'Invalid avatar URL for profile update' });
                    return;
                 }
             }

             if (Object.keys(profileData).length === 0) {
                res.status(400).json({ message: 'No data provided for update' });
                return;
             }

             const updatedUser = await UserService.updateUserProfile(userId, profileData);
             res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });

         } catch (error: any) {
             console.error("Update User Profile Error:", error);
             res.status(500).json({ message: error.message || 'Failed to update user profile' });
         }
     }

    // 处理头像上传
    public static async uploadAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.userId;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            if (!req.file) {
                res.status(400).json({ message: 'No file uploaded' });
                return;
            }

            // Construct the URL path stored in the database and returned to the client
            // Use the /static/ prefix consistent with other image URLs
            const avatarPath = `/static/images/avatars/${req.file.filename}`;

            // Call UserService to update the avatarUrl in the database
            const updatedUser = await UserService.updateUserProfile(userId, { avatarUrl: avatarPath });

            // Ensure the response includes the correct URL and the updated user object
            res.status(200).json({ 
                message: 'Avatar uploaded successfully', 
                avatarUrl: avatarPath, // Return the correct URL path
                user: updatedUser // Return the updated user object
            });

        } catch (error: any) {
            console.error("Upload Avatar Error:", error);
             // Multer 错误处理 (例如文件过大)
            if (error instanceof multer.MulterError) {
                 res.status(400).json({ message: `Upload error: ${error.message}` });
            } else if (error.message === '只允许上传图片文件!') {
                 res.status(400).json({ message: error.message });
            }
            else {
                res.status(500).json({ message: error.message || 'Failed to upload avatar' });
            }
        }
    }

    // --- Controller methods for user's associated data ---
    public static async getUserFavorites(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.userId;
            if (!userId) {
                 res.status(401).json({ message: 'Unauthorized' });
                 return;
            }
            const page = parseInt(req.query.page as string) || 1; 
            const limit = parseInt(req.query.limit as string) || 10; 
            const favoritesData = await FavoriteService.fetchUserFavoritesPage(userId, { page, limit }); // <-- New call
            res.status(200).json(favoritesData);
        } catch (error: any) {
            console.error("Get User Favorites Error:", error);
            res.status(500).json({ message: error.message || 'Failed to get favorites' });
        }
    }

    public static async getUserPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
         try {
             const userId = req.userId;
             if (!userId) {
                 res.status(401).json({ message: 'Unauthorized' });
                 return;
             }
             const page = parseInt(req.query.page as string) || 1; 
             const limit = parseInt(req.query.limit as string) || 10; 
             // Use getAllPosts with authorId filter
             const postsData = await PostService.getAllPosts({ 
                 page,
                 limit, 
                 authorId: userId, // Filter by the logged-in user
                 currentUserId: userId // Ensure isLiked/isFavorited is relative to the user
              });
             res.status(200).json(postsData); // Return the paginated response directly
         } catch (error: any) {
             console.error("Get User Posts Error:", error);
             res.status(500).json({ message: error.message || 'Failed to get posts' });
         }
     }

    public static async getUserNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
             const userId = req.userId;
             if (!userId) {
                 res.status(401).json({ message: 'Unauthorized' });
                 return;
             }
             const page = parseInt(req.query.page as string) || 1; 
             const limit = parseInt(req.query.limit as string) || 10; 
             // Corrected method name and pass options
             const notificationsData = await NotificationService.getNotifications(userId, { page, limit }); 
             res.status(200).json(notificationsData); // Return the paginated response directly
        } catch (error: any) {
            console.error("Get User Notifications Error:", error);
            res.status(500).json({ message: error.message || 'Failed to get notifications' });
        }
    }
    // --- End methods ---

    /**
     * Get a list of available default avatar image URLs.
     */
    static async getDefaultAvatars(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const defaultAvatarDir = path.resolve(process.cwd(), 'public/avatars/defaults'); // Correct path relative to project root
            
            if (!fs.existsSync(defaultAvatarDir)) {
                 console.error(`[UserController] Default avatar directory not found: ${defaultAvatarDir}`);
                 res.status(404).json({ message: 'Default avatars directory not found.' });
                 return;
            }
            
            const files = fs.readdirSync(defaultAvatarDir);
            const avatarUrls = files
                .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
                .map(file => `/static/avatars/defaults/${file}`); // Ensure consistent /static prefix

            const response: DefaultAvatarsResponse = { avatarUrls };
            res.json(response);
        } catch (error) {
            console.error("Error fetching default avatars:", error);
            next(error); // Pass error to global handler
        }
    }

    /**
     * 发送密码重置验证码
     */
    public static async sendPasswordResetCode(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: '用户未认证' });
        }

        try {
            // 1. 获取用户信息（主要是邮箱）
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true } // 只查询需要的字段
            });

            if (!user || !user.email) {
                return res.status(404).json({ message: '找不到用户信息或用户邮箱未设置' });
            }

            // 2. 生成随机验证码 (例如：6位数字)
            const code = crypto.randomInt(100000, 999999).toString();

            // 3. 设置过期时间
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRATION_MINUTES);

            // 4. 将验证码存入数据库
            //    (可选) 在存入新验证码前，可以先删除该用户所有旧的/过期的验证码
            await prisma.passwordResetCode.deleteMany({ where: { userId: userId } });
            await prisma.passwordResetCode.create({
                data: {
                    code: code,
                    userId: userId,
                    expiresAt: expiresAt,
                }
            });

            // 5. 发送邮件
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
                // 邮件发送失败
                console.error(`[UserController.sendPasswordResetCode] Failed to send email to ${user.email} for user ${userId}`);
                return res.status(500).json({ message: '发送验证码失败，请稍后重试' });
            }

             // 对于 Ethereal，打印预览 URL
             if (typeof mailSent === 'string' && mailSent.includes('ethereal.email')) {
                console.log(`[UserController.sendPasswordResetCode] Ethereal preview URL: ${mailSent}`);
            }

            res.status(200).json({ message: '验证码已发送至您的邮箱，请注意查收' });

        } catch (error) {
            console.error('[UserController.sendPasswordResetCode] Error:', error);
            next(error); // 将错误传递给全局错误处理中间件
        }
    }

    /**
     * 修改当前登录用户的密码
     */
    public static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        const userId = req.userId;
        const { oldPassword, newPassword, confirmPassword, code } = req.body;

        // 1. 验证用户是否登录
        if (!userId) {
            return res.status(401).json({ message: '用户未认证' });
        }

        // 2. 基本输入验证
        if (!oldPassword || !newPassword || !confirmPassword || !code) {
            return res.status(400).json({ message: '缺少必要的字段 (oldPassword, newPassword, confirmPassword, code)' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: '新密码和确认密码不匹配' });
        }

        if (newPassword.length < 6) { // 示例密码复杂度
            return res.status(400).json({ message: '新密码长度至少需要6位' });
        }

        if (oldPassword === newPassword) {
             return res.status(400).json({ message: '新密码不能与旧密码相同' });
        }

        try {
            // 3. 获取当前用户信息（包括密码哈希）
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({ message: '找不到用户' });
            }

            // 4. 验证旧密码
            const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
            if (!isOldPasswordValid) {
                return res.status(400).json({ message: '旧密码不正确' });
            }

            // 5. 查找并验证验证码
            const resetCodeRecord = await prisma.passwordResetCode.findUnique({
                where: {
                    userId_code: { userId: userId, code: code }
                }
            });

            if (!resetCodeRecord) {
                return res.status(400).json({ message: '验证码无效或不匹配' });
            }

            // 6. 检查验证码是否过期
            const now = new Date();
            if (now > resetCodeRecord.expiresAt) {
                await prisma.passwordResetCode.delete({ where: { id: resetCodeRecord.id } }); // 删除过期码
                return res.status(400).json({ message: '验证码已过期，请重新发送' });
            }

            // 7. 验证通过，哈希新密码并更新
            const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedNewPassword }
            });

            // 8. 删除已使用的验证码
            await prisma.passwordResetCode.delete({ where: { id: resetCodeRecord.id } });

            res.status(200).json({ message: '密码修改成功' });

        } catch (error) {
            next(error);
        }
    }

    // 未来可以在这里添加更新用户等控制器方法
} 