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
exports.PostService = void 0;
// src/services/PostService.ts
const db_1 = __importDefault(require("../db"));
const client_1 = require("@prisma/client");
class PostService {
    // Helper function to process Prisma query result into PostWithRelations
    static processPostResult(postData, currentUserId) {
        var _a, _b;
        const isLiked = !!(currentUserId && ((_a = postData.likes) === null || _a === void 0 ? void 0 : _a.length));
        const isFavorited = !!(currentUserId && ((_b = postData.favoritedBy) === null || _b === void 0 ? void 0 : _b.length));
        // Create the final object, removing internal fields
        const result = {
            id: postData.id,
            title: postData.title,
            content: postData.content,
            imageUrl: postData.imageUrl,
            createdAt: postData.createdAt,
            updatedAt: postData.updatedAt,
            authorId: postData.authorId,
            author: postData.author,
            likesCount: postData._count.likes,
            commentsCount: postData._count.comments,
            favoritesCount: postData._count.favoritedBy,
            isLiked,
            isFavorited,
        };
        return result;
    }
    // 创建帖子
    static createPost(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield db_1.default.post.create({
                data: {
                    title: data.title,
                    content: data.content,
                    authorId: data.authorId,
                    imageUrl: data.imageUrl, // Include imageUrl if provided
                    // Counts default to 0 via Prisma schema, no need to set here
                },
                select: {
                    id: true, title: true, content: true, imageUrl: true, createdAt: true, updatedAt: true, authorId: true,
                    author: { select: { id: true, name: true, avatarUrl: true } },
                    _count: { select: { likes: true, comments: true, favoritedBy: true } }
                    // likes are not needed for the creator initially
                }
            });
            // Process the result (isLiked/isFavorited will be false)
            return this.processPostResult(post);
        });
    }
    // 获取所有帖子（分页，排序，可选当前用户ID以判断点赞/收藏状态）
    static getAllPosts(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page = 1, limit = 10, sortBy = 'createdAt', authorId, showcase, currentUserId } = options;
            const skip = (page - 1) * limit;
            const orderBy = {};
            // Handle sorting
            if (sortBy === 'likesCount') {
                orderBy.likes = { _count: 'desc' };
            }
            else if (sortBy === 'commentsCount') {
                orderBy.comments = { _count: 'desc' };
            }
            else { // Default to createdAt
                orderBy.createdAt = 'desc';
            }
            // Dynamic where clause
            const where = {};
            if (authorId) {
                where.authorId = authorId;
            }
            if (showcase === true) {
                where.isShowcase = true;
            }
            // Add other filters here if needed (e.g., tags, search)
            const selectClause = Object.assign({ id: true, title: true, content: true, imageUrl: true, createdAt: true, updatedAt: true, authorId: true, author: { select: { id: true, name: true, avatarUrl: true } }, _count: { select: { likes: true, comments: true, favoritedBy: true } } }, (currentUserId && {
                likes: { where: { userId: currentUserId }, select: { userId: true } },
                favoritedBy: { where: { userId: currentUserId }, select: { userId: true } }
            }));
            const postsData = yield db_1.default.post.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: selectClause,
            });
            const totalCount = yield db_1.default.post.count({ where });
            const posts = postsData.map(p => this.processPostResult(p, currentUserId));
            return { posts, totalCount };
        });
    }
    // 根据 ID 获取单个帖子
    static getPostById(postId, currentUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const selectClause = Object.assign({ id: true, title: true, content: true, imageUrl: true, createdAt: true, updatedAt: true, authorId: true, author: { select: { id: true, name: true, avatarUrl: true } }, _count: { select: { likes: true, comments: true, favoritedBy: true } } }, (currentUserId && {
                likes: { where: { userId: currentUserId }, select: { userId: true } },
                favoritedBy: { where: { userId: currentUserId }, select: { userId: true } }
            }));
            const postData = yield db_1.default.post.findUnique({
                where: { id: postId },
                select: selectClause
            });
            if (!postData)
                return null;
            return this.processPostResult(postData, currentUserId);
        });
    }
    // 更新帖子
    static updatePost(postId, data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield db_1.default.post.findUnique({ where: { id: postId } });
            if (!post)
                return null; // Post not found
            if (post.authorId !== userId) {
                throw new Error('Forbidden: You can only update your own posts');
            }
            const selectClause = {
                id: true, title: true, content: true, imageUrl: true, createdAt: true, updatedAt: true, authorId: true,
                author: { select: { id: true, name: true, avatarUrl: true } },
                _count: { select: { likes: true, comments: true, favoritedBy: true } },
                // Need to re-fetch like/fav status for the *current user* after update
                likes: { where: { userId: userId }, select: { userId: true } },
                favoritedBy: { where: { userId: userId }, select: { userId: true } }
            };
            const updatedPostData = yield db_1.default.post.update({
                where: { id: postId },
                data,
                select: selectClause
            });
            return this.processPostResult(updatedPostData, userId);
        });
    }
    // 删除帖子
    static deletePost(postId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // First check if the post exists and belongs to the user
            const post = yield db_1.default.post.findUnique({
                where: { id: postId },
                select: { authorId: true }
            });
            if (!post)
                return null; // Indicate not found
            if (post.authorId !== userId) {
                throw new Error('Forbidden: You can only delete your own posts');
            }
            // If checks pass, proceed with deletion
            // Use deleteMany to ensure the where condition applies atomically
            // Note: Prisma cascading deletes should handle related Likes, Comments, Favorites
            const result = yield db_1.default.post.deleteMany({
                where: {
                    id: postId,
                    authorId: userId, // Double check ownership during delete
                }
            });
            // result.count will be 1 if successful, 0 if not found or ownership check failed
            return result.count > 0 ? result : null;
        });
    }
    // Like a post
    static likePost(userId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingLike = yield db_1.default.like.findUnique({ where: { postId_userId: { postId, userId } } });
            if (existingLike)
                return existingLike;
            try {
                return yield db_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const newLike = yield tx.like.create({ data: { userId, postId } });
                    const postAuthor = yield tx.post.findUnique({ where: { id: postId }, select: { authorId: true } });
                    if (postAuthor && postAuthor.authorId !== userId) {
                        yield tx.notification.create({ data: { type: 'LIKE', recipientId: postAuthor.authorId, senderId: userId, postId } });
                    }
                    return newLike;
                }));
            }
            catch (error) {
                console.error(`[PostService.likePost] Error liking post ${postId} for user ${userId}:`, error);
                throw error;
            }
        });
    }
    // Unlike a post (No notification needed for unlike)
    static unlikePost(userId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield db_1.default.like.delete({ where: { postId_userId: { postId, userId } } });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
                    return null;
                console.error(`[PostService.unlikePost] Error unliking post ${postId} for user ${userId}:`, error);
                throw error;
            }
        });
    }
    // Create a new comment or reply (Corrected based on regenerated client)
    static createComment(postId, commentData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { text, authorId, parentId } = commentData;
            try {
                return yield db_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const newComment = yield tx.comment.create({
                        data: {
                            text,
                            postId,
                            authorId,
                            parentId // This should now be valid
                        },
                        include: { author: { select: { id: true, name: true, avatarUrl: true } } }
                    });
                    const post = yield tx.post.findUnique({ where: { id: postId }, select: { authorId: true } });
                    if (post && post.authorId !== authorId) {
                        yield tx.notification.create({ data: { type: parentId ? 'REPLY' : 'COMMENT', recipientId: post.authorId, senderId: authorId, postId, commentId: newComment.id } });
                    }
                    return newComment;
                }));
            }
            catch (error) {
                console.error(`[PostService.createComment] Error creating comment for post ${postId}:`, error);
                throw error;
            }
        });
    }
    // Get comments for a post - Use defined CommentWithAuthor type
    static getCommentsByPostId(postId) {
        return __awaiter(this, void 0, void 0, function* () {
            const comments = yield db_1.default.comment.findMany({
                where: { postId: postId, parentId: null }, // Fetch only top-level comments
                orderBy: { createdAt: 'asc' },
                include: {
                    author: { select: { id: true, name: true, avatarUrl: true } }
                    // Not including replies here for simplicity/performance
                }
            });
            // Map to match the defined CommentWithAuthor structure
            return comments.map(c => ({
                id: c.id,
                text: c.text,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
                author: {
                    id: c.author.id,
                    name: c.author.name,
                    avatarUrl: c.author.avatarUrl
                }
            })); // Remove the unnecessary 'as CommentWithAuthor[]' cast
        });
    }
    // Delete a comment (Remove commentsCount update)
    static deleteComment(commentId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const comment = yield db_1.default.comment.findUnique({
                where: { id: commentId },
                select: { authorId: true, post: { select: { authorId: true } } }
            });
            if (!comment || (comment.authorId !== userId && comment.post.authorId !== userId)) {
                throw new Error('Comment not found or permission denied');
            }
            try {
                // Transaction no longer needed just for deleting comment
                // TODO: Add transaction back if needing to delete related notifications
                const deletedComment = yield db_1.default.comment.delete({ where: { id: commentId } });
                // Removed post count update
                // await tx.post.update({ ... data: { commentsCount: { decrement: 1 } } ... });
                return deletedComment;
            }
            catch (error) {
                console.error(`[PostService.deleteComment] Error deleting comment ${commentId}:`, error);
                throw error;
            }
        });
    }
    // 收藏帖子
    static favoritePost(userId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingFavorite = yield db_1.default.favorite.findUnique({ where: { userId_postId: { userId, postId } } });
            if (existingFavorite) {
                return existingFavorite;
            }
            try {
                return yield db_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const newFavorite = yield tx.favorite.create({ data: { userId, postId } });
                    const post = yield tx.post.findUnique({ where: { id: postId }, select: { authorId: true } });
                    if (post && post.authorId !== userId) {
                        yield tx.notification.create({ data: { type: 'FAVORITE', recipientId: post.authorId, senderId: userId, postId } });
                    }
                    return newFavorite;
                }));
            }
            catch (error) {
                console.error(`[PostService.favoritePost] Error favoring post ${postId} for user ${userId}:`, error);
                throw error;
            }
        });
    }
    // 取消收藏帖子
    static unfavoritePost(userId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield db_1.default.favorite.delete({ where: { userId_postId: { userId, postId } } });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
                    return null;
                console.error(`[PostService.unfavoritePost] Error unfavoring post ${postId} for user ${userId}:`, error);
                throw error;
            }
        });
    }
    // 获取用户自己的帖子 - Correct return type
    static getMyPosts(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, options = {}) {
            // Reuse getAllPosts logic, passing the authorId
            return this.getAllPosts(Object.assign(Object.assign({}, options), { authorId: userId, currentUserId: userId }));
        });
    }
}
exports.PostService = PostService;
//# sourceMappingURL=PostService.js.map