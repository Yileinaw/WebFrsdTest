import { Response, Request, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/AuthMiddleware';
import { PostService } from '../services/PostService';
import { FavoriteService } from '../services/FavoriteService';
import { NotificationService } from '../services/NotificationService';
import multer from 'multer';
import fs from 'fs'; // Import fs module
import path from 'path'; // Import path module
import { Prisma, PrismaClient, User } from '@prisma/client'; // <-- Import Prisma Client and User type
import { supabase } from '../lib/supabaseClient'; // <-- Import Supabase client
import { sendMail } from '../utils/mailer'; // <-- Import mailer
import crypto from 'crypto'; // <-- Import crypto
import bcrypt from 'bcrypt'; // <-- Import bcrypt
import { UserService } from '../services/UserService';

// Define a type for the response of getDefaultAvatars
interface DefaultAvatarsResponse {
    avatarUrls: string[];
}

// Define a simple type for public user data used in lists
type UserPublicListData = {
    id: number;
    username: string | null; // Keep null possible if schema allows
    avatarUrl: string | null;
    bio: string | null;
}

// Type for the structure returned by the findMany query for followers/following
// Use Prisma generated types where possible, define explicitly if needed
type FollowerItem = Prisma.FollowsGetPayload<{ select: { follower: { select: { id: true, username: true, avatarUrl: true, bio: true } } } }>
type FollowingItem = Prisma.FollowsGetPayload<{ select: { following: { select: { id: true, username: true, avatarUrl: true, bio: true } } } }>

const prisma = new PrismaClient(); // <-- Instantiate Prisma Client
const CODE_EXPIRATION_MINUTES = 10; // <-- Define expiration time
const SALT_ROUNDS = 10; // Salt rounds for bcrypt

// --- 类型接口定义 ---
// 用于获取用户信息的接口，与后端 getUserById 返回一致
export interface UserProfileData {
    id: number;
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
    bio: string | null;
    joinedAt: string; // ISO Date String
    postCount: number;
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
    // 可能还包含 email, role, isEmailVerified 用于个人设置页
    email?: string;
    role?: string;
    isEmailVerified?: boolean;
}

// 用于更新个人资料后，后端返回的数据结构 (通常是更新后的 UserProfileData)
export interface UpdatedUserProfileResponse {
    message: string;
    user: UserProfileData;
}

// 用于获取关注/粉丝列表的分页响应
export interface PaginatedUserListResponse {
    followers?: UserPublicListData[]; // 对应 getFollowers
    following?: UserPublicListData[]; // 对应 getFollowing
    currentPage: number;
    totalPages: number;
    totalFollowers?: number; // 对应 getFollowers
    totalFollowing?: number; // 对应 getFollowing
}

// Define specific response types based on backend controllers
interface UserProfileResponse {
    message?: string;
    user: Omit<User, 'password'>;
}

export class UserController {
    // 获取特定用户信息
    public static async getUserById(req: AuthenticatedRequest, res: Response): Promise<any> {
        try {
            // + Restore old manual validation
            const targetUserId = parseInt(req.params.userId, 10);
            if (isNaN(targetUserId)) {
                return res.status(400).json({ message: 'Invalid user ID' });
            }
            const currentUserId = req.userId;

            const user = await prisma.user.findUnique({
                where: { id: targetUserId },
                select: {
                    id: true,
                    username: true,
                    name: true,
                    email: true,
                    role: true,
                    avatarUrl: true,
                    bio: true,
                    createdAt: true,
                    updatedAt: true,
                    isEmailVerified: true,
                    emailVerificationToken: true,
                    _count: { 
                        select: {
                            posts: true,
                            followers: true,
                            following: true,
                            favorites: true
                        }
                    },
                }
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            let isFollowing = false;
            if (currentUserId && currentUserId !== targetUserId) {
                // Use prisma.follows assuming it exists after generate
                const followStatus = await prisma.follows.findUnique({
                    where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
                    select: { followerId: true }
                });
                isFollowing = !!followStatus;
            }

            const userData = {
                ...user,
                postCount: user._count?.posts ?? 0,
                followerCount: user._count?.followers ?? 0,
                followingCount: user._count?.following ?? 0,
                favoritesCount: user._count?.favorites ?? 0,
                isFollowing: isFollowing,
            };
            delete (userData as any)._count;

            return res.status(200).json(userData);

        } catch (error: any) {
             if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2021' || error.message.includes('follows'))) {
                 console.error('Prisma Client error (Table or field not found, maybe run prisma generate?):', error);
                 return res.status(500).json({ message: 'Server configuration error related to database schema.' });
            } else {
                console.error('Get User By ID Error:', error);
                return res.status(500).json({ message: 'Internal server error retrieving user data' });
            }
        }
    }

    // 获取当前登录用户信息
    public static async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized: User ID not found after authentication' });
            return;
        }

        try {
            // Directly fetch the current user with all necessary fields (except password)
            const currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,            // Include email
                    username: true,         // Include username
                    name: true,             // Include name
                    role: true,             // Include role
                    avatarUrl: true,        // Include avatarUrl
                    bio: true,              // Include bio
                    createdAt: true,        // Include createdAt
                    updatedAt: true,        // Include updatedAt
                    isEmailVerified: true,    // Include isEmailVerified
                    emailVerificationToken: true, // Include emailVerificationToken
                    // Include counts for the dropdown
                    _count: {
                        select: {
                            posts: true,
                            followers: true,
                            following: true,
                        }
                    }
                }
            });

            if (!currentUser) {
                // This case should technically not happen if middleware is correct, but handle it
                console.error(`[UserController.getCurrentUser] User with ID ${userId} found in token but not in DB.`);
                res.status(404).json({ message: 'User not found' });
                 return;
            }

            // Construct the response data including counts
            const responseData = {
                ...currentUser,
                postCount: currentUser._count?.posts ?? 0,
                followerCount: currentUser._count?.followers ?? 0,
                followingCount: currentUser._count?.following ?? 0,
            };
            // Remove the _count object itself from the response
            delete (responseData as any)._count;

            // Return the augmented user object
            res.status(200).json(responseData);

        } catch (error) {
            console.error(`[UserController.getCurrentUser] Error fetching user ${userId}:`, error);
            res.status(500).json({ message: 'Internal server error fetching current user data' });
        }
    }

    // 新增：专门处理更新当前登录用户个人资料
    public static async updateMe(req: AuthenticatedRequest, res: Response): Promise<any> {
        const userId = req.userId; // 使用认证中间件提供的用户 ID
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: User ID not found' });
        }

        const { name, bio, avatarUrl } = req.body;

        // 构建更新数据 (允许 null 用于 avatarUrl)
        const updateData: { name?: string; bio?: string | null; avatarUrl?: string | null } = {};
        let isUpdatingAvatar = false; // Flag to track if avatar is being updated

        if (name !== undefined) {
            if (typeof name !== 'string') {
                return res.status(400).json({ message: 'Name must be a string' });
            }
            updateData.name = name;
        }
        if (bio !== undefined) {
             if (typeof bio !== 'string' && bio !== null) {
                 return res.status(400).json({ message: 'Bio must be a string or null' });
             }
            updateData.bio = bio;
        }
         if (avatarUrl !== undefined) {
             // Validate the incoming avatarUrl: must be null or a valid string URL
             if (avatarUrl === null || typeof avatarUrl === 'string') {
                 updateData.avatarUrl = avatarUrl;
                 isUpdatingAvatar = true; // Mark that avatar is part of this update
             } else {
                 // Reject if avatarUrl is provided but not null or a string
                 return res.status(400).json({ message: 'Invalid avatarUrl format. Must be a string or null.' });
             }
        }

        if (Object.keys(updateData).length === 0) {
             return res.status(400).json({ message: 'No valid fields provided for update' });
        }

        try {
            // --- Step 2: Call Service to update the database --- 
            const updatedUser = await UserService.updateUserProfile(userId, updateData);

             if (!updatedUser) {
                 return res.status(404).json({ message: 'User not found or update failed internally' });
             }
            // --- End Step 2 --- 

            // --- Step 4: Return success response --- 
            return res.status(200).json({
                 message: 'Profile updated successfully',
                 user: updatedUser // Return the updated user profile
             });

        } catch (error: any) {
            // Handle errors from Prisma or other potential issues
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                 return res.status(409).json({ message: 'Username already taken' }); 
            } else if (error.message.includes('not found')) { 
                 return res.status(404).json({ message: error.message });
            } else {
                console.error(`[UserController.updateMe] Error updating profile for user ${userId}:`, error);
                return res.status(500).json({ message: 'Internal server error updating profile' });
            }
        }
    }

    // 更新用户个人资料
    public static async updateUserProfile(req: AuthenticatedRequest, res: Response): Promise<any> {
        const currentUserId = req.userId; // Keep using currentUserId
        if (!currentUserId) {
            return res.status(401).json({ message: 'Unauthorized: User ID not found in request' });
        }

        // + Restore old targetUserId parsing and body extraction
        const targetUserId = parseInt(req.params.userId, 10); // Assuming route is /users/:userId
        if (isNaN(targetUserId)) { 
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        const { username, name, bio, avatarUrl } = req.body;

        // + Restore old manual validation for body fields
        const updateData: Prisma.UserUpdateInput = {};
        if (username !== undefined) {
            if (typeof username !== 'string') {
                return res.status(400).json({ message: 'Username must be a string' });
            }
            updateData.username = username;
        }
        if (name !== undefined) {
            if (typeof name !== 'string' && name !== null) {
                return res.status(400).json({ message: 'Name must be a string or null' });
            }
            updateData.name = name;
        }
        if (bio !== undefined) {
            if (typeof bio !== 'string' && bio !== null) {
                return res.status(400).json({ message: 'Bio must be a string or null' });
            }
            updateData.bio = bio;
        }
        if (avatarUrl !== undefined) {
             if (avatarUrl === null || (typeof avatarUrl === 'string' && avatarUrl.startsWith('/avatars/defaults/'))) {
                 updateData.avatarUrl = avatarUrl;
             } else {
                 console.warn(`[UserController.updateUserProfile] Invalid default avatarUrl received: ${avatarUrl}. Ignoring.`);
                 // If avatarUrl is provided but invalid, don't include it in updateData
             }
        }

        if (Object.keys(updateData).length === 0) {
             // Keep check for empty update
             return res.status(400).json({ message: 'No valid fields provided for update' });
        }

        try {
            // + Call service with potentially different signature (will be reverted later)
            // Assuming UserService.updateUserProfile will be reverted to accept only targetUserId and data
            // We need to pass targetUserId here, not currentUserId
            const updatedUser = await UserService.updateUserProfile(targetUserId, updateData);
            
            // ... rest of try block (processing updatedUser) ...
             if (!updatedUser) { // Restore simple check
                 return res.status(404).json({ message: 'User not found or update failed' });
             }
            // Process response data (assuming service returns necessary data)
             const userData = {
                 ...updatedUser,
                 // Manually add counts if service doesn't return them (needs fetch)
             };
             // delete (userData as any)._count;
             return res.status(200).json({ message: 'Profile updated successfully', user: userData });

        } catch (error: any) {
             // - Remove specific error handling for ForbiddenError etc.
             // + Restore simpler catch block
             if (error instanceof Prisma.PrismaClientKnownRequestError) {
                  if (error.code === 'P2002') { 
                      return res.status(409).json({ message: 'Username already taken' });
                  } else if (error.code === 'P2025') {
                       return res.status(404).json({ message: 'User not found' });
                  }
                 console.error('[UserController.updateUserProfile] Prisma Error:', error.code, error.meta);
                 return res.status(500).json({ message: `Database error (Code: ${error.code})` });
                 } else {
                 console.error('[UserController.updateUserProfile] Unknown Error:', error);
                 return res.status(500).json({ message: 'Internal server error updating profile' });
             }
         }
     }

    // 处理头像上传 (修改为使用 Supabase)
    public static async uploadAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
            const userId = req.userId;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            if (!req.file) {
                res.status(400).json({ message: 'No avatar file uploaded' });
                return;
            }

            const fileBuffer = req.file.buffer;
            const originalName = req.file.originalname;
            const fileExt = path.extname(originalName);
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            // Store avatars in a specific folder for users, including user ID for clarity
            const fileName = `user-${userId}-${uniqueSuffix}${fileExt}`;
            const filePath = `user-avatars/${fileName}`; // Path within the Supabase bucket

            const bucketName = process.env.SUPABASE_BUCKET_NAME;
            if (!bucketName) {
                console.error('[UserController.uploadAvatar] Supabase bucket name not configured in .env');
                res.status(500).json({ message: '服务器配置错误：存储桶名称未设置。' });
                return;
            }

            let oldSupabasePath: string | null = null;

            try {
                // 1. Get the old avatar URL before uploading the new one
                const user = await prisma.user.findUnique({
                     where: { id: userId },
                     select: { avatarUrl: true }
                 });
                const oldAvatarUrl = user?.avatarUrl;

                // 2. Attempt to parse the old URL to get the Supabase path if it exists
                if (oldAvatarUrl && oldAvatarUrl.includes(process.env.SUPABASE_URL ?? 'supabase.co')) {
                    try {
                        const url = new URL(oldAvatarUrl);
                        // Path format: /storage/v1/object/public/bucketName/filePath
                        const pathSegments = url.pathname.split('/');
                        const bucketNameIndex = pathSegments.findIndex(segment => segment === bucketName);
                        if (bucketNameIndex > -1 && pathSegments.length > bucketNameIndex + 1) {
                            const potentialPath = pathSegments.slice(bucketNameIndex + 1).join('/');
                            if (potentialPath.startsWith('user-avatars/')) {
                                oldSupabasePath = potentialPath;
                                console.log(`[UserController.uploadAvatar] Found old USER avatar path to delete: ${oldSupabasePath}`);
                            } else {
                                console.log(`[UserController.uploadAvatar] Old avatar path ${potentialPath} is not a user avatar, skipping deletion.`);
                            }
                        }
                    } catch (parseError) {
                        console.error(`[UserController.uploadAvatar] Failed to parse old avatar URL ${oldAvatarUrl}:`, parseError);
                        // Don't block the process if parsing fails, just won't delete the old file
                    }
                }

                // 3. Upload the new file to Supabase Storage
                console.log(`[UserController.uploadAvatar] Attempting to upload to Supabase. Bucket: ${bucketName}, Path: ${filePath}`); // Log upload details
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, fileBuffer, {
                        contentType: req.file.mimetype,
                        cacheControl: '3600', // Cache for 1 hour
                        upsert: false // Don't overwrite
                    });

                // Log Supabase upload result unconditionally
                console.log('[UserController.uploadAvatar] Supabase upload result:', { uploadData, uploadError });

                if (uploadError) {
                    console.error(`[UserController.uploadAvatar] Supabase upload error for user ${userId}:`, uploadError);
                    res.status(500).json({ message: '上传新头像到云存储失败。', error: uploadError.message });
                    return;
                }
                // Add check if uploadData is valid (it might be null even without error in some cases)
                if (!uploadData || !uploadData.path) {
                    console.error(`[UserController.uploadAvatar] Supabase upload returned no data/path even without explicit error. Response:`, uploadData);
                    res.status(500).json({ message: '上传新头像到云存储失败 (无有效响应)。' });
                    return;
                }

                // 4. Get the public URL for the newly uploaded file
                console.log(`[UserController.uploadAvatar] Attempting to get public URL for path: ${filePath}`); // Log path for getPublicUrl
                const { data: urlData } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(filePath);

                console.log('[UserController.uploadAvatar] Supabase getPublicUrl result:', { urlData }); // Log getPublicUrl result

                if (!urlData || !urlData.publicUrl) {
                    console.error(`[UserController.uploadAvatar] Failed to get public URL from Supabase for new avatar:`, filePath);
                    // Attempt to clean up the uploaded file if URL retrieval fails
                    console.log(`[UserController.uploadAvatar] Cleaning up potentially uploaded file due to URL failure: ${filePath}`);
                    await supabase.storage.from(bucketName).remove([filePath]);
                    res.status(500).json({ message: '获取新头像链接失败。' });
                    return;
                }
                const newImageUrl = urlData.publicUrl;
                console.log(`[UserController.uploadAvatar] Obtained new public URL: ${newImageUrl}`); // Log the new URL

                // 5. Update user's avatarUrl in the database with the new Supabase URL
                console.log(`[UserController.uploadAvatar] Attempting to update user ${userId} avatarUrl in DB to: ${newImageUrl}`); // Log before DB update
                await prisma.user.update({
                    where: { id: userId },
                    data: { avatarUrl: newImageUrl }
                });
                console.log(`[UserController.uploadAvatar] Successfully updated user ${userId} avatarUrl in DB.`); // Log after DB update

                // 6. Delete the old avatar file from Supabase if a path was successfully extracted
                if (oldSupabasePath) {
                    console.log(`[UserController.uploadAvatar] Attempting to delete old Supabase avatar: ${oldSupabasePath}`);
                    const { error: deleteError } = await supabase.storage
                        .from(bucketName)
                        .remove([oldSupabasePath]);

                    if (deleteError) {
                        // Log the error but don't fail the request, as the main goal (upload+update DB) succeeded
                        console.error(`[UserController.uploadAvatar] Failed to delete old Supabase avatar file ${oldSupabasePath} for user ${userId}:`, deleteError);
                    } else {
                        console.log(`[UserController.uploadAvatar] Successfully deleted old Supabase avatar: ${oldSupabasePath}`);
                    }
                }

                // 7. Return success response with the new URL
                console.log(`[UserController.uploadAvatar] Sending success response for user ${userId}`); // Log before sending response
                res.status(200).json({ 
                    message: 'Avatar uploaded successfully', 
                    avatarUrl: newImageUrl // Return the new Supabase public URL
                });

            } catch (error: any) {
                console.error(`[UserController.uploadAvatar] Error processing avatar update for user ${userId}:`, error);
                // Generic error if something else went wrong (e.g., Prisma update failed after upload)
                // We don't attempt cleanup here as the state is uncertain
                res.status(500).json({ message: '更新头像时发生内部错误。' });
            }
        }

    // 关注用户
    public static async followUser(req: AuthenticatedRequest, res: Response): Promise<any> {
        const followerId = req.userId;
        if (!followerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // + Restore old validation
        const followingId = parseInt(req.params.userId, 10);
        if (isNaN(followingId)) {
            return res.status(400).json({ message: 'Invalid user ID to follow' });
        }

        // Keep self-follow check
        if (followerId === followingId) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }

        try {
            const followingUser = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });
            if (!followingUser) {
                return res.status(404).json({ message: '要关注的用户不存在' });
            }

            await prisma.follows.create({ data: { followerId: followerId, followingId: followingId } });
            return res.status(201).json({ message: '关注成功' });
        } catch (error: any) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                return res.status(409).json({ message: '已经关注了该用户' });
            } else {
                console.error('[UserController.followUser] Error:', error);
                return res.status(500).json({ message: '关注用户时发生内部错误' });
            }
        }
    }

    // 取消关注用户
    public static async unfollowUser(req: AuthenticatedRequest, res: Response): Promise<any> {
        const followerId = req.userId;
        if (!followerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // + Restore old validation
        const followingId = parseInt(req.params.userId, 10);
        if (isNaN(followingId)) {
            return res.status(400).json({ message: 'Invalid user ID to unfollow' });
        }

        // Keep self-unfollow check
        if (followerId === followingId) {
             return res.status(400).json({ message: '不能取消关注自己' });
        }

        try {
            await prisma.follows.delete({ where: { followerId_followingId: { followerId: followerId, followingId: followingId } } });
            return res.status(200).json({ message: '取消关注成功' });
        } catch (error: any) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                // Record not found, means the user wasn't following them in the first place
                return res.status(404).json({ message: '未关注该用户' });
            } else {
                console.error('[UserController.unfollowUser] Error:', error);
                return res.status(500).json({ message: '取消关注时发生内部错误' });
            }
        }
    }

    // 获取关注者列表
    public static async getFollowers(req: AuthenticatedRequest, res: Response): Promise<any> {
        try {
            // + Restore old validation and parsing
            const targetUserId = parseInt(req.params.userId, 10);
            if (isNaN(targetUserId)) {
                return res.status(400).json({ message: 'Invalid user ID' });
            }
            const currentUserId = req.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            // Use prisma.follows
            const [followersData, totalFollowers] = await prisma.$transaction([
                prisma.follows.findMany({
                    where: { followingId: targetUserId },
                    select: { follower: { select: { id: true, username: true, avatarUrl: true, bio: true } } },
                    orderBy: { createdAt: 'desc' }, skip: skip, take: limit,
                }),
                prisma.follows.count({ where: { followingId: targetUserId } })
            ]);

            // Explicitly type the mapped result and filter nulls
            const followers: UserPublicListData[] = followersData
                .map((f: { follower: UserPublicListData | null }) => f.follower)
                .filter((u): u is UserPublicListData => u != null);

            // Check follow status if current user exists
            let followersWithStatus = followers.map(f => ({ ...f, isFollowing: false }));
            if (currentUserId && followers.length > 0) {
                const followerIds = followers.map(f => f.id);
                const followingSet = new Set(
                    (await prisma.follows.findMany({
                        where: {
                            followerId: currentUserId,
                            followingId: { in: followerIds },
                        },
                        select: { followingId: true },
                    })).map(follow => follow.followingId)
                );
                followersWithStatus = followers.map(f => ({
                    ...f,
                    isFollowing: followingSet.has(f.id),
                }));
            }

            const totalPages = Math.ceil(totalFollowers / limit);
            return res.status(200).json({ followers: followersWithStatus, currentPage: page, totalPages, totalFollowers });
        } catch (error: any) {
            console.error('Get Followers Error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    // 获取正在关注列表
    public static async getFollowing(req: AuthenticatedRequest, res: Response): Promise<any> {
        try {
            // + Restore old validation and parsing
            const targetUserId = parseInt(req.params.userId, 10);
             if (isNaN(targetUserId)) {
                 return res.status(400).json({ message: 'Invalid user ID' });
             }
            const currentUserId = req.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            // Use prisma.follows
            const [followingData, totalFollowing] = await prisma.$transaction([
                 prisma.follows.findMany({
                    where: { followerId: targetUserId },
                    select: { following: { select: { id: true, username: true, avatarUrl: true, bio: true } } },
                    orderBy: { createdAt: 'desc' }, skip: skip, take: limit,
                }),
                prisma.follows.count({ where: { followerId: targetUserId } })
            ]);

            // Explicitly type the mapped result and filter nulls
            const following: UserPublicListData[] = followingData
                .map((f: { following: UserPublicListData | null }) => f.following)
                .filter((u): u is UserPublicListData => u != null);

            // Check follow status if current user exists
            let followingWithStatus = following.map(f => ({ ...f, isFollowing: false }));
            if (currentUserId && following.length > 0) {
                const followingIds = following.map(f => f.id);
                const followingSet = new Set(
                    (await prisma.follows.findMany({
                        where: {
                            followerId: currentUserId,
                            followingId: { in: followingIds },
                        },
                        select: { followingId: true },
                    })).map(follow => follow.followingId)
                );
                followingWithStatus = following.map(f => ({
                    ...f,
                    isFollowing: followingSet.has(f.id),
                }));
            }

            const totalPages = Math.ceil(totalFollowing / limit);
            return res.status(200).json({ following: followingWithStatus, currentPage: page, totalPages, totalFollowing });
        } catch (error: any) {
            console.error('Get Following Error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    // 获取用户收藏夹
    public static async getUserFavorites(req: AuthenticatedRequest, res: Response): Promise<any> {
        try {
            // + Restore old validation and parsing
            const targetUserId = parseInt(req.params.userId, 10);
            if (isNaN(targetUserId)) {
                return res.status(400).json({ message: 'Invalid user ID' });
            }
            const page = parseInt(req.query.page as string) || 1; 
            const limit = parseInt(req.query.limit as string) || 10; 

            const result = await FavoriteService.getFavoritesByUserId(targetUserId, { page, limit });
            return res.status(200).json(result);
        } catch (error: any) {
            console.error("Get User Favorites Error:", error);
            return res.status(500).json({ message: error.message || 'Failed to get user favorites' });
        }
    }

     // 获取 "我的" 帖子列表
     public static async getMyPosts(req: AuthenticatedRequest, res: Response): Promise<any> {
         try {
             const userId = req.userId;
             if (!userId) {
                return res.status(401).json({ message: 'Unauthorized: User ID not found' });
             }
            // + Restore old parsing
             const page = parseInt(req.query.page as string) || 1; 
             const limit = parseInt(req.query.limit as string) || 10; 

            const result = await PostService.getAllPosts({ page, limit, authorId: userId, currentUserId: userId });
            return res.status(200).json(result);
         } catch (error: any) {
            console.error('[UserController] Get My Posts Error:', error);
            return res.status(500).json({ message: 'Internal server error retrieving my posts' });
        }
    }

    // 获取特定用户的帖子列表
    public static async getUserPosts(req: AuthenticatedRequest, res: Response): Promise<any> {
        try {
            // + Restore old validation and parsing
            const targetUserId = parseInt(req.params.userId, 10);
            if (isNaN(targetUserId)) {
                return res.status(400).json({ message: 'Invalid user ID' });
            }
            const currentUserId = req.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await PostService.getAllPosts({ page, limit, authorId: targetUserId, currentUserId: currentUserId });
            return res.status(200).json(result);
        } catch (error: any) {
            console.error('[UserController] Get User Posts Error:', error);
            return res.status(500).json({ message: 'Internal server error retrieving user posts' });
        }
    }

    // 获取用户通知
    public static async getUserNotifications(req: AuthenticatedRequest, res: Response): Promise<any> {
        try {
             const userId = req.userId;
             if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
             }
             // + Restore old parsing
             const page = parseInt(req.query.page as string) || 1; 
             const limit = parseInt(req.query.limit as string) || 10; 
             const filter = req.query.filter as string | undefined;

            const options: { page?: number; limit?: number; unreadOnly?: boolean } = { page, limit };
            if (filter === 'unread') {
                options.unreadOnly = true;
            }
            const result = await NotificationService.getNotifications(userId, options);
            return res.status(200).json(result);
        } catch (error: any) {
            console.error('[UserController] Get User Notifications Error:', error);
            return res.status(500).json({ message: 'Internal server error fetching notifications' });
        }
    }

    // 修改为返回固定的 Supabase 预设头像 URL
    static async getDefaultAvatars(req: Request, res: Response, next: NextFunction): Promise<void> {
        // 确保使用 public 访问路径
        const baseUrl = "https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/preset-avatars";
        const presetAvatarUrls = [
            `${baseUrl}/1.jpg`,
            `${baseUrl}/2.jpg`,
            `${baseUrl}/3.jpg`,
            `${baseUrl}/4.jpg`,
            `${baseUrl}/5.jpg`
        ];

        try {
            // 设置 CORS 头
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            
            // 直接返回数组
            res.status(200).json(presetAvatarUrls);
        } catch (error) {
            console.error('[UserController.getDefaultAvatars] Error:', error);
            res.status(500).json({ message: 'Failed to get default avatars' });
        }
    }

    // 发送密码重置码
    public static async sendPasswordResetCode(req: AuthenticatedRequest, res: Response, next: NextFunction) {
       try {
           const userId = req.userId;
           if (!userId) {
               return res.status(401).json({ message: '用户未授权' });
           }

           const user = await prisma.user.findUnique({ where: { id: userId } });
           if (!user || !user.email) { // 确保用户存在且有邮箱
               return res.status(404).json({ message: '未找到用户或用户邮箱信息不完整' });
           }

           const code = crypto.randomInt(100000, 999999).toString();
           const expiresAt = new Date();
           expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRATION_MINUTES);

           // 清除该用户旧的密码重置码 (如果有)
           await prisma.passwordResetCode.deleteMany({ where: { userId: user.id } });

           // 创建新的密码重置码
           await prisma.passwordResetCode.create({
               data: {
                   code: code,
                   userId: user.id,
                   expiresAt: expiresAt,
               }
           });

           const mailSubject = '修改您的账户密码';
           const mailText = `您正在尝试修改密码。您的验证码是： ${code}\n\n该验证码将在 ${CODE_EXPIRATION_MINUTES} 分钟后过期。如果您没有进行此操作，请忽略此邮件。`;
           const mailHtml = `<p>您正在尝试修改密码。您的验证码是： <strong>${code}</strong></p><p>该验证码将在 <strong>${CODE_EXPIRATION_MINUTES} 分钟</strong>后过期。如果您没有进行此操作，请忽略此邮件。</p>`;

           const mailSent = await sendMail({
               to: user.email,
               subject: mailSubject,
               text: mailText,
               html: mailHtml,
           });

           if (!mailSent) {
               console.error(`[UserController.sendPasswordResetCode] 邮件发送失败给 ${user.email}`);
               // 即便邮件发送失败，从安全角度考虑，不应向客户端明确指示邮件发送环节的问题
               // 但应记录详细日志，以便排查
               // 可以考虑返回一个通用成功消息，避免泄露过多内部状态，或根据具体策略返回错误
               // 此处为了明确，我们返回500，但生产环境可能需要更细致的处理
               return res.status(500).json({ message: '发送验证码邮件时发生内部错误' });
           }
            if (typeof mailSent === 'string' && mailSent.includes('ethereal.email')) {
                console.log(`[UserController.sendPasswordResetCode] Ethereal preview URL: ${mailSent}`);
            }

           res.status(200).json({ message: '验证码已发送至您的注册邮箱，请注意查收。' });

       } catch (error) {
           console.error('[UserController.sendPasswordResetCode] Error:', error);
           res.status(500).json({ message: '发送验证码过程中发生错误' });
       }
    }

    // 修改密码
    public static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
       try {
           const userId = req.userId;
           if (!userId) {
               return res.status(401).json({ message: '用户未授权' });
           }

           const { oldPassword, newPassword, confirmPassword, code } = req.body;

           if (!oldPassword || !newPassword || !confirmPassword || !code) {
               return res.status(400).json({ message: '缺少必要的字段 (oldPassword, newPassword, confirmPassword, code)' });
           }

           if (newPassword !== confirmPassword) {
               return res.status(400).json({ message: '新密码和确认密码不匹配' });
           }

           if (newPassword.length < 6) { // 与 AuthController.resetPassword 保持一致
               return res.status(400).json({ message: '新密码长度至少需要6位' });
           }

           const user = await prisma.user.findUnique({ where: { id: userId } });
           if (!user) {
               // 理论上不应发生，因为 userId 来自认证token
               return res.status(404).json({ message: '未找到用户' });
           }

           // 1. 校验旧密码
           const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
           if (!isOldPasswordValid) {
               return res.status(400).json({ message: '旧密码不正确' });
           }

           // 2. 校验验证码
           const resetCodeRecord = await prisma.passwordResetCode.findUnique({
               where: {
                   // Prisma v2.20.0 及以上版本支持这种方式查找复合唯一键
                   // 确保你的 schema.prisma 中 PasswordResetCode 模型有 @@unique([userId, code])
                   // 如果没有，或者版本较低，你可能需要用 findFirst + where: { userId: user.id, code: code }
                   userId_code: {
                       userId: user.id,
                       code: code
                   }
               }
           });

           if (!resetCodeRecord) {
               return res.status(400).json({ message: '无效的验证码' });
           }

           const now = new Date();
           if (now > resetCodeRecord.expiresAt) {
               await prisma.passwordResetCode.delete({ where: { id: resetCodeRecord.id } }); // 删除过期的验证码
               return res.status(400).json({ message: '验证码已过期，请重新请求' });
           }

           // 3. 更新密码
           const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
           await prisma.user.update({
               where: { id: user.id },
               data: { password: hashedNewPassword }
           });

           // 4. 删除已使用的验证码
           await prisma.passwordResetCode.delete({ where: { id: resetCodeRecord.id } });

           res.status(200).json({ message: '密码修改成功' });

       } catch (error) {
           console.error('[UserController.changePassword] Error:', error);
           res.status(500).json({ message: '修改密码过程中发生错误' });
       }
    }

    // 获取所有用户
    public static async getAllUsers(req: Request, res: Response): Promise<any> {
         try {
             const users = await prisma.user.findMany({
                 select: { id: true, username: true, email: true, role: true, createdAt: true }
             });
             return res.status(200).json(users);
         } catch (error: any) {
             console.error("Get All Users Error:", error);
             return res.status(500).json({ message: "Internal server error" });
         }
    }

    // 删除用户
    public static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
         const currentUserId = req.userId;
         if (!currentUserId) {
              return res.status(401).json({ message: "Unauthorized" }) as any;
         }
         // + Restore old validation
         const targetUserId = parseInt(req.params.userId, 10);
         if (isNaN(targetUserId)) {
             return res.status(400).json({ message: "Invalid user ID" }) as any;
         }
         
         // Keep TODO for permission check
         // TODO: Add proper permission check here (e.g., only admin or self)

        try {
             await prisma.user.delete({ where: { id: targetUserId } });
             res.status(204).send();
         } catch (error: any) {
             if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                 return res.status(404).json({ message: "User not found" }) as any;
             } else {
                 console.error('Delete User Error:', error);
                 return res.status(500).json({ message: "Internal server error" }) as any;
             }
         }
    }
}

// Remove standalone functions if they are already static methods in the class
// export const getAllUsers = ...
// export const deleteUser = ...

// 注意：原始文件中 updateUserProfile 和 uploadAvatar 是静态方法，保持一致。
// 注意：原始文件没有 getAllUsers 和 deleteUser 方法，如果 UserRoutes 中引用了，这里需要添加。

// --- 添加可能缺失的 getAllUsers 和 deleteUser (根据 UserRoutes 推断) ---
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        // 示例：简单获取所有用户，实际应用中应加入分页和权限控制
        const users = await prisma.user.findMany({
            select: { id: true, username: true, email: true, role: true, createdAt: true } // 选择性返回字段
        });
        res.status(200).json(users);
    } catch (error: any) {
        console.error("Get All Users Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
     const targetUserId = parseInt(req.params.userId, 10);
     const currentUserId = req.userId; // 执行操作的用户

     // 权限检查：通常只有管理员或用户自己能删除 (取决于业务逻辑)
     // if (!currentUserId || (currentUserId !== targetUserId && !isAdmin(currentUserId))) {
     //      return res.status(403).json({ message: "Forbidden" });
     // }
     // 简化：假设只有认证用户可以删除，未来添加管理员角色检查
      if (!currentUserId) {
           return res.status(401).json({ message: "Unauthorized" });
       }
       if (isNaN(targetUserId)) {
            return res.status(400).json({ message: "Invalid user ID" });
       }


     try {
         // 注意：删除用户可能会因外键约束失败，需要处理关联数据或调整 schema
         await prisma.user.delete({ where: { id: targetUserId } });
         res.status(204).send(); // No Content
     } catch (error: any) {
         if (error.code === 'P2025') {
             res.status(404).json({ message: "User not found" });
         } else {
             console.error("Delete User Error:", error);
             res.status(500).json({ message: "Internal server error deleting user" });
             // 可以进一步检查 P2003 外键约束错误
         }
     }
}; 
