import { Response, Request, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { AuthenticatedRequest } from '../middleware/AuthMiddleware';
import { PostService } from '../services/PostService';
import { FavoriteService } from '../services/FavoriteService';
import { NotificationService } from '../services/NotificationService';
import multer from 'multer';
import fs from 'fs'; // Import fs module
import path from 'path'; // Import path module

// Define a type for the response of getDefaultAvatars
interface DefaultAvatarsResponse {
    avatarUrls: string[];
}

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

    // 未来可以在这里添加更新用户等控制器方法
} 