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
exports.deleteUser = exports.getAllUsers = exports.UserController = void 0;
const PostService_1 = require("../services/PostService");
const FavoriteService_1 = require("../services/FavoriteService");
const NotificationService_1 = require("../services/NotificationService");
const fs_1 = __importDefault(require("fs")); // Import fs module
const path_1 = __importDefault(require("path")); // Import path module
const client_1 = require("@prisma/client"); // <-- Import Prisma Client and User type
const prisma = new client_1.PrismaClient(); // <-- Instantiate Prisma Client
const CODE_EXPIRATION_MINUTES = 10; // <-- Define expiration time
const SALT_ROUNDS = 10; // Salt rounds for bcrypt
class UserController {
    // 获取特定用户信息
    static getUserById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            try {
                const targetUserId = parseInt(req.params.userId, 10);
                const currentUserId = req.userId;
                if (isNaN(targetUserId)) {
                    return res.status(400).json({ message: 'Invalid user ID' });
                }
                const user = yield prisma.user.findUnique({
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
                    const followStatus = yield prisma.follows.findUnique({
                        where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
                        select: { followerId: true }
                    });
                    isFollowing = !!followStatus;
                }
                const userData = Object.assign(Object.assign({}, user), { postCount: (_b = (_a = user._count) === null || _a === void 0 ? void 0 : _a.posts) !== null && _b !== void 0 ? _b : 0, followerCount: (_d = (_c = user._count) === null || _c === void 0 ? void 0 : _c.followers) !== null && _d !== void 0 ? _d : 0, followingCount: (_f = (_e = user._count) === null || _e === void 0 ? void 0 : _e.following) !== null && _f !== void 0 ? _f : 0, isFollowing: isFollowing });
                delete userData._count;
                return res.status(200).json(userData);
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && (error.code === 'P2021' || error.message.includes('follows'))) {
                    console.error('Prisma Client error (Table or field not found, maybe run prisma generate?):', error);
                    return res.status(500).json({ message: 'Server configuration error related to database schema.' });
                }
                else {
                    console.error('Get User By ID Error:', error);
                    return res.status(500).json({ message: 'Internal server error retrieving user data' });
                }
            }
        });
    }
    // 获取当前登录用户信息
    static getCurrentUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = req.userId;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized: User ID not found after authentication' });
                return;
            }
            try {
                // Directly fetch the current user with all necessary fields (except password)
                const currentUser = yield prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        email: true, // Include email
                        username: true, // Include username
                        name: true, // Include name
                        role: true, // Include role
                        avatarUrl: true, // Include avatarUrl
                        bio: true, // Include bio
                        createdAt: true, // Include createdAt
                        updatedAt: true, // Include updatedAt
                        isEmailVerified: true, // Include isEmailVerified
                        emailVerificationToken: true // Include emailVerificationToken
                        // Exclude password
                        // Exclude counts (_count) unless needed by the frontend /me response
                    }
                });
                if (!currentUser) {
                    // This case should technically not happen if middleware is correct, but handle it
                    console.error(`[UserController.getCurrentUser] User with ID ${userId} found in token but not in DB.`);
                    res.status(404).json({ message: 'User not found' });
                    return;
                }
                // Return the full user object (without password)
                res.status(200).json(currentUser);
            }
            catch (error) {
                console.error(`[UserController.getCurrentUser] Error fetching user ${userId}:`, error);
                res.status(500).json({ message: 'Internal server error fetching current user data' });
            }
        });
    }
    // 更新用户个人资料
    static updateUserProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized: User ID not found in request' });
            }
            const { username, name, bio } = req.body;
            let { avatarUrl } = req.body;
            const updateData = {};
            // Validation and building updateData
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
                }
                else {
                    console.warn(`[UserController.updateUserProfile] Invalid default avatarUrl received: ${avatarUrl}. Ignoring.`);
                }
            }
            if (Object.keys(updateData).length === 0) {
                if (req.body.avatarUrl && !updateData.hasOwnProperty('avatarUrl')) {
                    console.warn('[UserController.updateUserProfile] Called likely from uploadAvatar but avatarUrl was invalid and ignored.');
                    try {
                        // Fetch current data in consistent format
                        const currentUser = yield prisma.user.findUnique({
                            where: { id: userId },
                            select: {
                                id: true, username: true, name: true, avatarUrl: true, bio: true, createdAt: true,
                                email: true, role: true, isEmailVerified: true,
                                _count: { select: { posts: true, followers: true, following: true } }
                            }
                        });
                        if (!currentUser) {
                            return res.status(404).json({ message: 'User not found' });
                        }
                        const responseData = {
                            id: currentUser.id, username: currentUser.username, name: currentUser.name,
                            avatarUrl: currentUser.avatarUrl, bio: currentUser.bio, joinedAt: currentUser.createdAt,
                            postCount: (_b = (_a = currentUser._count) === null || _a === void 0 ? void 0 : _a.posts) !== null && _b !== void 0 ? _b : 0, followerCount: (_d = (_c = currentUser._count) === null || _c === void 0 ? void 0 : _c.followers) !== null && _d !== void 0 ? _d : 0,
                            followingCount: (_f = (_e = currentUser._count) === null || _e === void 0 ? void 0 : _e.following) !== null && _f !== void 0 ? _f : 0, isFollowing: false,
                            email: currentUser.email, role: currentUser.role, isEmailVerified: currentUser.isEmailVerified
                        };
                        return res.status(200).json({ message: 'Profile update skipped (invalid avatar URL), returning current user data.', user: responseData });
                    }
                    catch (findError) {
                        console.error("Error finding user after invalid avatar upload:", findError);
                        return res.status(500).json({ message: 'Internal server error fetching user data after failed update attempt.' });
                    }
                }
                return res.status(400).json({ message: 'No valid update data provided' });
            }
            try {
                const updatedUser = yield prisma.user.update({
                    where: { id: userId },
                    data: updateData,
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        name: true,
                        avatarUrl: true,
                        bio: true,
                        role: true,
                        createdAt: true,
                        updatedAt: true,
                        isEmailVerified: true,
                        emailVerificationToken: true
                    }
                });
                return res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
            }
            catch (error) {
                console.error("Update User Profile Error:", error);
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    if (error.code === 'P2002') {
                        return res.status(400).json({ message: 'Username already exists.' });
                    }
                    if (error.code === 'P2025') {
                        return res.status(404).json({ message: 'User not found' });
                    }
                }
                return res.status(500).json({ message: error.message || 'Failed to update user profile' });
            }
        });
    }
    // 处理头像上传
    static uploadAvatar(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = req.userId;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            if (!req.file) {
                res.status(400).json({ message: 'No avatar file uploaded' });
                return;
            }
            // Correct relative file path based on static serving config
            // Assumes multer saves directly into 'avatars' subdir within the storage/uploads
            const relativeFilePath = `/uploads/avatars/${req.file.filename}`;
            console.log(`[UserController.uploadAvatar] User ${userId} uploaded file: ${req.file.filename}, DB Path: ${relativeFilePath}`);
            try {
                // Get the old avatar URL to potentially delete the old file
                const user = yield prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
                const oldAvatarUrl = user === null || user === void 0 ? void 0 : user.avatarUrl;
                // Update user's avatarUrl in the database with the correct path
                yield prisma.user.update({
                    where: { id: userId },
                    data: { avatarUrl: relativeFilePath }
                });
                // Delete the old avatar file if it exists and is not a default avatar
                if (oldAvatarUrl && !oldAvatarUrl.startsWith('/avatars/defaults/')) {
                    // Construct path relative to backend root, assuming /uploads maps to storage/uploads
                    const oldStoragePath = path_1.default.join(__dirname, '../../storage', oldAvatarUrl.replace('/uploads', ''));
                    console.log(`[UserController.uploadAvatar] Attempting to delete old avatar from storage: ${oldStoragePath}`);
                    fs_1.default.unlink(oldStoragePath, (err) => {
                        if (err && err.code !== 'ENOENT') {
                            console.error(`[UserController.uploadAvatar] Failed to delete old avatar file ${oldStoragePath}:`, err);
                        }
                        else if (!err) {
                            console.log(`[UserController.uploadAvatar] Successfully deleted old avatar: ${oldStoragePath}`);
                        }
                    });
                }
                res.status(200).json({
                    message: 'Avatar uploaded successfully',
                    avatarUrl: relativeFilePath // Return the new relative path
                });
            }
            catch (error) {
                console.error(`[UserController.uploadAvatar] Error updating user ${userId} avatar:`, error);
                // Attempt to delete the newly uploaded file if DB update failed
                const newStoragePath = path_1.default.join(__dirname, '../../storage', relativeFilePath.replace('/uploads', ''));
                fs_1.default.unlink(newStoragePath, (err) => {
                    if (err)
                        console.error(`[UserController.uploadAvatar] Failed to clean up uploaded file ${newStoragePath} after DB error:`, err);
                });
                res.status(500).json({ message: 'Failed to update avatar' });
            }
        });
    }
    // 关注用户
    static followUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const followerId = req.userId;
            const followingId = parseInt(req.params.userId, 10);
            if (!followerId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            if (isNaN(followingId)) {
                return res.status(400).json({ message: 'Invalid user ID to follow' });
            }
            if (followerId === followingId) {
                return res.status(400).json({ message: 'Cannot follow yourself' });
            }
            try {
                const followingUser = yield prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });
                if (!followingUser) {
                    return res.status(404).json({ message: 'User to follow not found' });
                }
                // Use prisma.follows
                yield prisma.follows.create({ data: { followerId: followerId, followingId: followingId } });
                return res.status(201).json({ message: 'Successfully followed user' });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                    return res.status(409).json({ message: 'Already following this user' });
                }
                else {
                    console.error('Follow User Error:', error);
                    return res.status(500).json({ message: 'Internal server error' });
                }
            }
        });
    }
    // 取消关注用户
    static unfollowUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const followerId = req.userId;
            const followingId = parseInt(req.params.userId, 10);
            if (!followerId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            if (isNaN(followingId)) {
                return res.status(400).json({ message: 'Invalid user ID to unfollow' });
            }
            try {
                // Use prisma.follows
                yield prisma.follows.delete({ where: { followerId_followingId: { followerId: followerId, followingId: followingId } } });
                return res.status(200).json({ message: 'Successfully unfollowed user' });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    return res.status(404).json({ message: 'Not following this user' });
                }
                else {
                    console.error('Unfollow User Error:', error);
                    return res.status(500).json({ message: 'Internal server error' });
                }
            }
        });
    }
    // 获取关注者列表
    static getFollowers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const targetUserId = parseInt(req.params.userId, 10);
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const skip = (page - 1) * limit;
                if (isNaN(targetUserId)) {
                    return res.status(400).json({ message: 'Invalid user ID' });
                }
                // Use prisma.follows
                const [followersData, totalFollowers] = yield prisma.$transaction([
                    prisma.follows.findMany({
                        where: { followingId: targetUserId },
                        select: { follower: { select: { id: true, username: true, avatarUrl: true, bio: true } } },
                        orderBy: { createdAt: 'desc' }, skip: skip, take: limit,
                    }),
                    prisma.follows.count({ where: { followingId: targetUserId } })
                ]);
                // Explicitly type the mapped result and filter nulls
                const followers = followersData
                    .map((f) => f.follower)
                    .filter((u) => u != null);
                const totalPages = Math.ceil(totalFollowers / limit);
                return res.status(200).json({ followers, currentPage: page, totalPages, totalFollowers });
            }
            catch (error) {
                console.error('Get Followers Error:', error);
                return res.status(500).json({ message: 'Internal server error' });
            }
        });
    }
    // 获取正在关注列表
    static getFollowing(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const targetUserId = parseInt(req.params.userId, 10);
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const skip = (page - 1) * limit;
                if (isNaN(targetUserId)) {
                    return res.status(400).json({ message: 'Invalid user ID' });
                }
                // Use prisma.follows
                const [followingData, totalFollowing] = yield prisma.$transaction([
                    prisma.follows.findMany({
                        where: { followerId: targetUserId },
                        select: { following: { select: { id: true, username: true, avatarUrl: true, bio: true } } },
                        orderBy: { createdAt: 'desc' }, skip: skip, take: limit,
                    }),
                    prisma.follows.count({ where: { followerId: targetUserId } })
                ]);
                // Explicitly type the mapped result and filter nulls
                const following = followingData
                    .map((f) => f.following)
                    .filter((u) => u != null);
                const totalPages = Math.ceil(totalFollowing / limit);
                return res.status(200).json({ following, currentPage: page, totalPages, totalFollowing });
            }
            catch (error) {
                console.error('Get Following Error:', error);
                return res.status(500).json({ message: 'Internal server error' });
            }
        });
    }
    // 获取用户收藏夹
    static getUserFavorites(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const result = yield FavoriteService_1.FavoriteService.getMyFavorites(userId, { page, limit });
                return res.status(200).json(result);
            }
            catch (error) {
                console.error("Get User Favorites Error:", error);
                return res.status(500).json({ message: error.message || 'Failed to get user favorites' });
            }
        });
    }
    // 获取 "我的" 帖子列表
    static getMyPosts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    return res.status(401).json({ message: 'Unauthorized: User ID not found' });
                }
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const result = yield PostService_1.PostService.getAllPosts({ page, limit, authorId: userId, currentUserId: userId });
                return res.status(200).json(result);
            }
            catch (error) {
                console.error('[UserController] Get My Posts Error:', error);
                return res.status(500).json({ message: 'Internal server error retrieving your posts' });
            }
        });
    }
    // 获取特定用户的帖子列表
    static getUserPosts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const targetUserId = parseInt(req.params.userId, 10);
                const currentUserId = req.userId;
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                if (isNaN(targetUserId)) {
                    return res.status(400).json({ message: 'Invalid user ID' });
                }
                const result = yield PostService_1.PostService.getAllPosts({ page, limit, authorId: targetUserId, currentUserId: currentUserId });
                return res.status(200).json(result);
            }
            catch (error) {
                console.error('[UserController] Get User Posts Error:', error);
                return res.status(500).json({ message: 'Internal server error retrieving user posts' });
            }
        });
    }
    // 获取用户通知
    static getUserNotifications(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const filter = req.query.filter;
                const options = { page, limit };
                if (filter === 'unread') {
                    options.unreadOnly = true;
                }
                const result = yield NotificationService_1.NotificationService.getNotifications(userId, options);
                return res.status(200).json(result);
            }
            catch (error) {
                console.error("Get User Notifications Error:", error);
                return res.status(500).json({ message: 'Internal server error fetching notifications' });
            }
        });
    }
    // 获取默认头像列表
    static getDefaultAvatars(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Define the directory where default avatars are stored relative to the project root
            // Correct the path: remove '/static'
            const defaultsDir = path_1.default.join(__dirname, '../../public/avatars/defaults');
            console.log(`[UserController.getDefaultAvatars] Reading defaults from: ${defaultsDir}`);
            try {
                // Check if directory exists
                if (!fs_1.default.existsSync(defaultsDir)) {
                    console.error(`[UserController.getDefaultAvatars] Default avatars directory not found: ${defaultsDir}`);
                    res.status(500).json({ message: 'Server configuration error: Default avatars directory not found.' });
                    return;
                }
                // Read directory contents
                const files = yield fs_1.default.promises.readdir(defaultsDir);
                // Filter for image files (e.g., png, jpg, jpeg, webp)
                const imageFiles = files.filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file));
                // Map filenames to relative URLs (as served by static middleware)
                // Correct the URL path: remove '/static'
                const avatarUrls = imageFiles.map(file => `/avatars/defaults/${file}`);
                console.log(`[UserController.getDefaultAvatars] Found defaults: ${JSON.stringify(avatarUrls)}`);
                res.status(200).json({ avatarUrls });
            }
            catch (error) {
                console.error("[UserController.getDefaultAvatars] Error reading default avatars directory:", error);
                next(error); // Pass to global error handler
            }
        });
    }
    // 发送密码重置码
    static sendPasswordResetCode(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    // 修改密码
    static changePassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    // 获取所有用户
    static getAllUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield prisma.user.findMany({
                    select: { id: true, username: true, email: true, role: true, createdAt: true }
                });
                return res.status(200).json(users);
            }
            catch (error) {
                console.error("Get All Users Error:", error);
                return res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    // 删除用户 (使用 as any 绕过类型检查)
    static deleteUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const targetUserId = parseInt(req.params.userId, 10);
            const currentUserId = req.userId;
            if (!currentUserId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (isNaN(targetUserId)) {
                return res.status(400).json({ message: "Invalid user ID" });
            }
            try {
                yield prisma.user.delete({ where: { id: targetUserId } });
                res.status(204).send();
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    if (error.code === 'P2025') {
                        return res.status(404).json({ message: "User not found" });
                    }
                    else if (error.code === 'P2003') {
                        console.error("Delete User Foreign Key Error:", error);
                        return res.status(409).json({ message: "Cannot delete user, associated data exists." });
                    }
                    else {
                        console.error("Delete User Prisma Error:", error);
                        return res.status(500).json({ message: "Database error deleting user" });
                    }
                }
                else {
                    console.error("Delete User Unknown Error:", error);
                    return res.status(500).json({ message: "Internal server error deleting user" });
                }
            }
        });
    }
}
exports.UserController = UserController;
// --- 移除类外部的重复定义 ---
// Ensure these functions are NOT defined outside the class if they are static methods
// --- 结束移除 ---
// 注意：原始文件中 updateUserProfile 和 uploadAvatar 是静态方法，保持一致。
// 注意：原始文件没有 getAllUsers 和 deleteUser 方法，如果 UserRoutes 中引用了，这里需要添加。
// --- 添加可能缺失的 getAllUsers 和 deleteUser (根据 UserRoutes 推断) ---
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 示例：简单获取所有用户，实际应用中应加入分页和权限控制
        const users = yield prisma.user.findMany({
            select: { id: true, username: true, email: true, role: true, createdAt: true } // 选择性返回字段
        });
        res.status(200).json(users);
    }
    catch (error) {
        console.error("Get All Users Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getAllUsers = getAllUsers;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield prisma.user.delete({
            where: { id: targetUserId }
        });
        res.status(204).send(); // No Content
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ message: "User not found" });
        }
        else {
            console.error("Delete User Error:", error);
            res.status(500).json({ message: "Internal server error deleting user" });
            // 可以进一步检查 P2003 外键约束错误
        }
    }
});
exports.deleteUser = deleteUser;
//# sourceMappingURL=UserController.js.map