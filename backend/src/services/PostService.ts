// src/services/PostService.ts
import prisma from '../db';
import { Post, Prisma, Like, User, Comment, Notification, Favorite } from '@prisma/client';

// Define the Post structure including relational data for consistency
// Match this with frontend Post type in types/models.ts
interface PostWithRelations {
    id: number;
    title: string;
    content: string | null;
    imageUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
    authorId: number;
    author: {
        id: number;
        name: string | null;
        avatarUrl?: string | null;
        isFollowing?: boolean;
    };
    tags?: { id: number; name: string }[]; // 标签信息
    isShowcase?: boolean; // 是否精选内容
    likesCount: number;
    commentsCount: number;
    favoritesCount: number;
    // Optional based on current user context
    isLiked?: boolean;
    isFavorited?: boolean;
    // These are used internally for calculations, don't expose directly
    _count?: {
        likes: number;
        comments: number;
        favoritedBy: number;
    };
    likes?: { userId: number }[];
    favoritedBy?: { userId: number }[];
}

// Helper type for internal processing, includes temporary fields from Prisma query
interface PostQueryResult extends Post {
     author: { id: number; name: string | null; avatarUrl?: string | null; };
     tags?: { id: number; name: string }[]; // 标签信息
     _count: {
         likes: number;
         comments: number;
         favoritedBy: number;
     };
    likes?: { userId: number }[];
    favoritedBy?: { userId: number }[];
}

// Define CommentWithAuthor type
interface CommentWithAuthor {
    id: number;
    text: string;
    createdAt: Date;
    updatedAt: Date;
    // Removed postId, authorId, parentId from this specific type
    author: {
        id: number;
        name: string | null;
        avatarUrl?: string | null;
    };
}

// Define the specific Paginated response type needed for UserProfileView and MyPosts
// Ensure this matches the structure your backend API actually returns
interface PaginatedUserPostsResponse {
    posts: Post[];
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    totalCount: number; // Ensure totalCount is number
}

export class PostService {
    // Helper function to process Prisma query result into PostWithRelations
    private static processPostResult(
        postData: PostQueryResult,
        currentUserId?: number | null,
        isFollowingAuthor?: boolean
    ): PostWithRelations {
        const isLiked = !!(currentUserId && postData.likes?.length);
        const isFavorited = !!(currentUserId && postData.favoritedBy?.length);

        // Create the final object, removing internal fields
        const result: PostWithRelations = {
            id: postData.id,
            title: postData.title,
            content: postData.content,
            imageUrl: postData.imageUrl,
            createdAt: postData.createdAt,
            updatedAt: postData.updatedAt,
            authorId: postData.authorId,
            author: {
                id: postData.author.id,
                name: postData.author.name,
                avatarUrl: postData.author.avatarUrl,
                isFollowing: isFollowingAuthor ?? false,
            },
            tags: postData.tags || [], // 添加标签信息
            isShowcase: postData.isShowcase, // 添加精选状态
            likesCount: postData._count.likes,
            commentsCount: postData._count.comments,
            favoritesCount: postData._count.favoritedBy,
            isLiked,
            isFavorited,
        };
        return result;
    }

    // 创建帖子 (添加标签处理)
    static async createPost(data: {
        title: string;
        content: string;
        authorId: number;
        imageUrl?: string;
        tagNames?: string[]; // <-- 添加 tagNames 到参数类型
    }): Promise<PostWithRelations> {

        const createData: Prisma.PostCreateInput = {
            title: data.title,
            content: data.content,
            author: { connect: { id: data.authorId } }, // Connect author by ID
            imageUrl: data.imageUrl, // Include imageUrl if provided
        };

        // 如果提供了标签名称，使用connectOrCreate添加标签
        if (data.tagNames && data.tagNames.length > 0) {
            createData.tags = {
                connectOrCreate: data.tagNames.map(tagName => ({
                    where: { name: tagName },
                    create: { name: tagName, isFixed: false }
                }))
            };
        }

        const post = await prisma.post.create({
            data: createData, // Use the constructed createData object
             select: { // Select all necessary fields for PostQueryResult
                 id: true, title: true, content: true, imageUrl: true, createdAt: true, updatedAt: true, authorId: true, isShowcase: true,
                 author: { select: { id: true, name: true, avatarUrl: true } },
                 tags: { select: { id: true, name: true } }, // 包含标签信息
                 _count: { select: { likes: true, comments: true, favoritedBy: true } }
             }
        });

        return this.processPostResult(post as PostQueryResult);
    }

    // 获取所有帖子（分页，排序，可选当前用户ID以判断点赞/收藏状态）
    static async getAllPosts(options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        search?: string; // 搜索关键词
        authorId?: number; // Filter by author
        showcase?: boolean; // 新增: Filter by showcase status
        tags?: string[]; // 标签筛选
        currentUserId?: number | null; // Check like/favorite status
    }): Promise<{ posts: PostWithRelations[]; totalCount: number }> {
        const { page = 1, limit = 10, sortBy = 'createdAt', search, authorId, showcase, tags, currentUserId } = options;
        const skip = (page - 1) * limit;
        const orderBy: Prisma.PostOrderByWithRelationInput = {};

        // Handle sorting
        if (sortBy === 'likesCount') {
            orderBy.likes = { _count: 'desc' };
        } else if (sortBy === 'commentsCount') {
            orderBy.comments = { _count: 'desc' };
        } else { // Default to createdAt
            orderBy.createdAt = 'desc';
        }

        // Dynamic where clause
        const where: Prisma.PostWhereInput = {};
        if (authorId) {
            where.authorId = authorId;
        }
        if (showcase === true) {
            where.isShowcase = true;
        }

        // 添加搜索条件
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
                // 搜索标签名称
                {
                    tags: {
                        some: {
                            name: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
            ];
        }

        // 添加标签筛选条件
        if (tags && tags.length > 0) {
            where.tags = {
                some: {
                    name: {
                        in: tags,
                        mode: 'insensitive'
                    },
                },
            };
        }

        const selectClause: Prisma.PostSelect = { // Define select clause for reusability
            id: true, title: true, content: true, imageUrl: true, createdAt: true, updatedAt: true, authorId: true, isShowcase: true,
            author: { select: { id: true, name: true, avatarUrl: true } },
            tags: { select: { id: true, name: true } }, // 包含标签信息
            _count: { select: { likes: true, comments: true, favoritedBy: true } },
             ...(currentUserId && {
                 likes: { where: { userId: currentUserId }, select: { userId: true } },
                 favoritedBy: { where: { userId: currentUserId }, select: { userId: true } }
             })
        };

        const postsData = await prisma.post.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            select: selectClause,
        });

        const totalCount = await prisma.post.count({ where });

        const posts = postsData.map(p => this.processPostResult(p as PostQueryResult, currentUserId));

        return { posts, totalCount };
    }

    // 根据 ID 获取单个帖子
    static async getPostById(postId: number, currentUserId?: number | null): Promise<PostWithRelations | null> {
        const selectClause: Prisma.PostSelect = { // Reuse select clause
            id: true, title: true, content: true, imageUrl: true, createdAt: true, updatedAt: true, authorId: true, isShowcase: true,
            author: { select: { id: true, name: true, avatarUrl: true } },
            tags: { select: { id: true, name: true } }, // 包含标签信息
            _count: { select: { likes: true, comments: true, favoritedBy: true } },
             ...(currentUserId && {
                 likes: { where: { userId: currentUserId }, select: { userId: true } },
                 favoritedBy: { where: { userId: currentUserId }, select: { userId: true } }
             })
        };

        const postData = await prisma.post.findUnique({
            where: { id: postId },
            select: selectClause
        });

        if (!postData) return null;

        let isFollowingAuthor = false;
        if (currentUserId && postData.authorId && currentUserId !== postData.authorId) {
            const follow = await prisma.follows.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: currentUserId,
                        followingId: postData.authorId,
                    },
                },
            });
            isFollowingAuthor = !!follow;
        }

        return this.processPostResult(postData as PostQueryResult, currentUserId, isFollowingAuthor);
    }

    // 更新帖子 (修正标签处理)
    static async updatePost(postId: number, data: Partial<{
        title: string;
        content: string;
        imageUrl: string | null;
        tagNames: string[];
    }>, userId: number): Promise<PostWithRelations | null> {

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true }
        });

        if (!post) return null;
        if (post.authorId !== userId) {
            throw new Error('Forbidden: You can only update your own posts');
        }

        // Build the update payload for Prisma
        const updatePayload: Prisma.PostUpdateInput = {};
        if (data.title !== undefined) updatePayload.title = data.title;
        if (data.content !== undefined) updatePayload.content = data.content;
        if (data.imageUrl !== undefined) updatePayload.imageUrl = data.imageUrl;

        // 如果提供了标签名称，处理标签更新
        if (data.tagNames !== undefined) {
            // 步骤1：确保所有提供的标签存在（可以并行完成）
            await Promise.all(
                data.tagNames.map(tagName =>
                    prisma.postTag.upsert({
                        where: { name: tagName },
                        update: {}, // 如果存在则不需要更新
                        create: { name: tagName, isFixed: false }
                    })
                )
            );

            // 步骤2：使用set只连接提供的标签
            updatePayload.tags = {
                set: data.tagNames.map(tagName => ({ name: tagName })) // 提供TagWhereUniqueInput数组
            };
        }

        // Only proceed if there's something to update
        if (Object.keys(updatePayload).length === 0) {
             console.log("[PostService.updatePost] No fields to update.");
             return this.getPostById(postId, userId);
        }

        const selectClause: Prisma.PostSelect = {
            id: true, title: true, content: true, imageUrl: true, createdAt: true, updatedAt: true, authorId: true, isShowcase: true,
            author: { select: { id: true, name: true, avatarUrl: true } },
            tags: { select: { id: true, name: true } }, // 包含标签信息
            _count: { select: { likes: true, comments: true, favoritedBy: true } },
             likes: { where: { userId: userId }, select: { userId: true } },
             favoritedBy: { where: { userId: userId }, select: { userId: true } }
        };

        const updatedPostData = await prisma.post.update({
            where: { id: postId },
            data: updatePayload,
            select: selectClause
        });

        return this.processPostResult(updatedPostData as PostQueryResult, userId);
    }

    // 删除帖子
    static async deletePost(postId: number, userId: number): Promise<Prisma.BatchPayload | null> {
        // First check if the post exists and belongs to the user
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true }
        });

        if (!post) return null; // Indicate not found
        if (post.authorId !== userId) {
            throw new Error('Forbidden: You can only delete your own posts');
        }

        // If checks pass, proceed with deletion
        // Use deleteMany to ensure the where condition applies atomically
        // Note: Prisma cascading deletes should handle related Likes, Comments, Favorites
        const result = await prisma.post.deleteMany({
            where: {
                id: postId,
                authorId: userId, // Double check ownership during delete
            }
        });

        // result.count will be 1 if successful, 0 if not found or ownership check failed
        return result.count > 0 ? result : null;
    }

    // Like a post
    public static async likePost(userId: number, postId: number): Promise<Like | null> {
        const existingLike = await prisma.like.findUnique({ where: { postId_userId: { postId, userId } } });
        if (existingLike) return existingLike;
        try {
            return await prisma.$transaction(async (tx) => {
                const newLike = await tx.like.create({ data: { userId, postId } });
                const postAuthor = await tx.post.findUnique({ where: { id: postId }, select: { authorId: true } });
                if (postAuthor && postAuthor.authorId !== userId) {
                     await tx.notification.create({ data: { type: 'LIKE', recipientId: postAuthor.authorId, senderId: userId, postId } });
                }
                return newLike;
            });
        } catch (error) {
             console.error(`[PostService.likePost] Error liking post ${postId} for user ${userId}:`, error);
             throw error;
        }
    }

    // Unlike a post (No notification needed for unlike)
    public static async unlikePost(userId: number, postId: number): Promise<Like | null> {
         try {
             return await prisma.like.delete({ where: { postId_userId: { postId, userId } } });
         } catch (error) {
             if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return null;
             console.error(`[PostService.unlikePost] Error unliking post ${postId} for user ${userId}:`, error);
             throw error;
         }
    }

    // Create a new comment or reply (Corrected based on regenerated client)
    public static async createComment(
        postId: number,
        commentData: { text: string; authorId: number; parentId?: number | null }
    ): Promise<Comment> {
         const { text, authorId, parentId } = commentData;
        try {
            return await prisma.$transaction(async (tx) => {
                const newComment = await tx.comment.create({
                    data: {
                         text,
                         postId,
                         authorId,
                         parentId // This should now be valid
                    },
                    include: { author: { select: { id: true, name: true, avatarUrl: true } } }
                });
                const post = await tx.post.findUnique({ where: { id: postId }, select: { authorId: true } });
                if (post && post.authorId !== authorId) {
                     await tx.notification.create({ data: { type: parentId ? 'REPLY' : 'COMMENT', recipientId: post.authorId, senderId: authorId, postId, commentId: newComment.id } });
                }
                return newComment;
            });
        } catch (error) {
             console.error(`[PostService.createComment] Error creating comment for post ${postId}:`, error);
             throw error;
        }
    }

    // 获取帖子的所有评论（包括回复）
    public static async getCommentsByPostId(postId: number): Promise<Comment[]> { // Return full Comment objects
        try {
            const comments = await prisma.comment.findMany({
                where: {
                    postId: postId,
                    // Remove parentId: null to fetch ALL comments for the post
                    // parentId: null
                },
                 orderBy: { createdAt: 'asc' }, // Keep ordering
                 include: {
                    author: { // Include author details
                        select: { id: true, name: true, avatarUrl: true }
                    }
                    // We might need parentId later for nesting, so return full Comment
                }
            });
            // We need the full Comment structure (including parentId) for frontend nesting
            return comments;
        } catch (error) {
            console.error(`Error fetching comments for post ${postId}:`, error);
            throw new Error('Failed to fetch comments');
        }
    }

    // Delete a comment (Remove commentsCount update)
    public static async deleteComment(commentId: number, userId: number): Promise<Comment | null> {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { authorId: true, post: { select: { authorId: true } } }
        });
        if (!comment || (comment.authorId !== userId && comment.post.authorId !== userId)) {
            throw new Error('Comment not found or permission denied');
        }
        try {
            // Transaction no longer needed just for deleting comment
            // TODO: Add transaction back if needing to delete related notifications
            const deletedComment = await prisma.comment.delete({ where: { id: commentId } });

            // Removed post count update
            // await tx.post.update({ ... data: { commentsCount: { decrement: 1 } } ... });

            return deletedComment;
        } catch (error) {
            console.error(`[PostService.deleteComment] Error deleting comment ${commentId}:`, error);
            throw error;
        }
    }

    // 收藏帖子
    public static async favoritePost(userId: number, postId: number): Promise<Favorite | null> {
        const existingFavorite = await prisma.favorite.findUnique({ where: { userId_postId: { userId, postId } } });
        if (existingFavorite) { return existingFavorite; }

        try {
            return await prisma.$transaction(async (tx) => {
                const newFavorite = await tx.favorite.create({ data: { userId, postId } });
                const post = await tx.post.findUnique({ where: { id: postId }, select: { authorId: true } });
                if (post && post.authorId !== userId) {
                    await tx.notification.create({ data: { type: 'FAVORITE', recipientId: post.authorId, senderId: userId, postId } });
                }
                return newFavorite;
            });
        } catch (error) {
             console.error(`[PostService.favoritePost] Error favoring post ${postId} for user ${userId}:`, error);
             throw error;
        }
    }

    // 取消收藏帖子
    public static async unfavoritePost(userId: number, postId: number): Promise<Favorite | null> {
        try {
            return await prisma.favorite.delete({ where: { userId_postId: { userId, postId } } });
        } catch (error) {
             if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return null;
             console.error(`[PostService.unfavoritePost] Error unfavoring post ${postId} for user ${userId}:`, error);
             throw error;
        }
    }

    // 获取用户自己的帖子 - Correct return type
    public static async getMyPosts(userId: number, options: { page?: number, limit?: number } = {}): Promise<{ posts: PostWithRelations[]; totalCount: number }> {
        // Reuse getAllPosts logic, passing the authorId
        return this.getAllPosts({ ...options, authorId: userId, currentUserId: userId });
    }
}