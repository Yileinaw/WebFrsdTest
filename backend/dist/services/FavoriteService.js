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
exports.FavoriteService = void 0;
const db_1 = __importDefault(require("../db"));
const client_1 = require("@prisma/client");
class FavoriteService {
    /**
     * Add a post to user's favorites.
     */
    static favoritePost(userId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingFavorite = yield db_1.default.favorite.findUnique({ where: { userId_postId: { userId, postId } } });
            if (existingFavorite)
                return existingFavorite;
            // Transaction: Create favorite & notification (No count update needed)
            try {
                const [newFavorite, post] = yield db_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const favorite = yield tx.favorite.create({ data: { userId, postId } });
                    // Fetch post author for notification
                    const postData = yield tx.post.findUnique({ where: { id: postId }, select: { authorId: true } });
                    return [favorite, postData];
                }));
                // Create Notification (Use senderId)
                if (post && post.authorId !== userId) {
                    try {
                        yield db_1.default.notification.create({
                            data: { recipientId: post.authorId, senderId: userId, postId, type: 'FAVORITE' }
                        });
                    }
                    catch (error) { /* Log notification error */ }
                }
                return newFavorite;
            }
            catch (error) {
                console.error(`[FavoriteService.favoritePost] Error:`, error);
                throw error; // Re-throw
            }
        });
    }
    /**
     * Remove a post from user's favorites.
     */
    static unfavoritePost(userId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Transaction: Delete favorite (No count update needed)
            try {
                return yield db_1.default.favorite.delete({ where: { userId_postId: { userId, postId } } });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
                    return null;
                console.error(`[FavoriteService.unfavoritePost] Error:`, error);
                throw error; // Re-throw other errors
            }
        });
    }
    /**
     * Get posts favorited by a specific user with pagination.
     */
    static fetchUserFavoritesPage(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, options = {}) {
            const { page = 1, limit = 10 } = options;
            const skip = (page - 1) * limit;
            // Fetch total count of favorites for the user
            const totalCount = yield db_1.default.favorite.count({
                where: { userId },
            });
            // Fetch paginated favorite records using SELECT to ensure all needed fields are present
            const favoriteRecords = yield db_1.default.favorite.findMany({
                where: { userId },
                select: {
                    // Select necessary fields from Favorite itself if needed (e.g., createdAt)
                    // createdAt: true, 
                    post: {
                        select: {
                            id: true,
                            title: true,
                            content: true,
                            imageUrl: true,
                            createdAt: true,
                            updatedAt: true,
                            isShowcase: true, // Ensure isShowcase is selected
                            status: true, // <-- 添加 status
                            deletedAt: true, // <-- 添加 deletedAt
                            author: {
                                select: { id: true, name: true, avatarUrl: true }
                            },
                            likes: {
                                where: { userId: userId },
                                select: { id: true }
                            },
                            _count: {
                                select: { likes: true, comments: true, favoritedBy: true }
                            },
                            viewCount: true
                        } // End of post select
                    } // End of post relation select
                }, // End of top-level select
                orderBy: { createdAt: 'desc' }, // Need to order by a field selected or available (e.g., post.createdAt)
                // orderBy: { post: { createdAt: 'desc' } }, // Example: Order by post creation date
                skip,
                take: limit,
            });
            // Process data and explicitly build PostWithAuthor objects
            const posts = favoriteRecords
                .map(favRecord => {
                var _a, _b, _c, _d, _e, _f, _g;
                // favRecord now only contains the 'post' object based on the select
                const postData = favRecord.post;
                if (!postData)
                    return null;
                const authorInfo = postData.author ? {
                    id: postData.author.id,
                    name: postData.author.name,
                    avatarUrl: postData.author.avatarUrl
                } : null;
                // Construct the PostWithAuthor object
                const processedPost = {
                    id: postData.id,
                    title: postData.title,
                    content: postData.content,
                    imageUrl: postData.imageUrl,
                    createdAt: postData.createdAt,
                    updatedAt: postData.updatedAt,
                    author: authorInfo,
                    likesCount: (_b = (_a = postData._count) === null || _a === void 0 ? void 0 : _a.likes) !== null && _b !== void 0 ? _b : 0,
                    commentsCount: (_d = (_c = postData._count) === null || _c === void 0 ? void 0 : _c.comments) !== null && _d !== void 0 ? _d : 0,
                    favoritesCount: (_f = (_e = postData._count) === null || _e === void 0 ? void 0 : _e.favoritedBy) !== null && _f !== void 0 ? _f : 0,
                    isLiked: !!(postData.likes && postData.likes.length > 0),
                    isFavorited: true,
                    isShowcase: postData.isShowcase,
                    viewCount: (_g = postData.viewCount) !== null && _g !== void 0 ? _g : 0,
                    status: postData.status,
                    deletedAt: postData.deletedAt,
                };
                return processedPost;
            })
                .filter((p) => p !== null);
            return { posts, totalCount };
        });
    }
    /**
     * Get posts favorited by the *currently logged-in* user.
     */
    static getMyFavorites(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, options = {}) {
            // Directly call the fetching logic with the logged-in user's ID
            return this.fetchUserFavoritesPage(userId, options);
        });
    }
    /**
     * Get posts favorited by a *specific* user (identified by targetUserId).
     */
    static getFavoritesByUserId(targetUserId_1) {
        return __awaiter(this, arguments, void 0, function* (targetUserId, options = {}) {
            // Directly call the fetching logic with the target user's ID
            return this.fetchUserFavoritesPage(targetUserId, options);
        });
    }
}
exports.FavoriteService = FavoriteService;
//# sourceMappingURL=FavoriteService.js.map