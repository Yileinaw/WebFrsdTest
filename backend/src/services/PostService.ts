import { Prisma, Post, Like, Comment, Favorite, PostStatus, User } from '@prisma/client'; // Added User for author type
import prisma from '../db'; // Corrected import path

// Define frontend expected post structure
export interface PostWithRelations {
    id: number;
    title: string;
    content: string | null;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    authorId: number;
    author: {
        id: number;
        name: string | null;
        avatarUrl?: string | null;
        isFollowing: boolean;
    };
    tags: { id: number; name: string }[]; // Will be empty for now
    isShowcase: boolean;
    likesCount: number;
    commentsCount: number;
    favoritesCount: number;
    isLiked: boolean;
    isFavorited: boolean;
    viewCount?: number;
    status?: PostStatus;
    deletedAt?: Date | null;
}

// Define paginated response type
interface PaginatedPostsResponse {
    posts: PostWithRelations[];
    totalCount: number;
}

// Simplified query result type without complex tags
interface PostQueryResult {
    id: number;
    title: string;
    content: string | null;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    authorId: number;
    isShowcase: boolean;
    author: { id: number; name: string | null; avatarUrl?: string | null };
    _count: { likes: number; comments: number; favoritedBy: number };
    likes?: { userId: number }[];
    favoritedBy?: { userId: number }[];
    viewCount?: number; // Kept as it's often useful
    status?: PostStatus; // Kept for admin/specific queries
    deletedAt?: Date | null; // Kept for admin/specific queries
    tags?: { id: number; name: string }[]; // Added for related tags
    // PostTags is intentionally omitted for this revert
}

// Extending the data type for updatePost to include optional tagNames
interface UpdatePostData extends Partial<Pick<Post, 'title' | 'content' | 'imageUrl' | 'isShowcase' | 'status'>> {
    tagNames?: string[];
}

export class PostService {
    private static processPostResult(
        postData: PostQueryResult,
        currentUserId?: number | null,
        isFollowingAuthor?: boolean
    ): PostWithRelations {
        const isLiked = !!(currentUserId && postData.likes?.length);
        const isFavorited = !!(currentUserId && postData.favoritedBy?.length);

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
            tags: postData.tags || [], // Map tags, default to empty array
            isShowcase: postData.isShowcase,
            likesCount: postData._count.likes,
            commentsCount: postData._count.comments,
            favoritesCount: postData._count.favoritedBy,
            isLiked,
            isFavorited,
            viewCount: postData.viewCount,
            status: postData.status,
            deletedAt: postData.deletedAt,
        };
        return result;
    }

    static async createPost(data: {
        title: string;
        content?: string;
        imageUrl?: string;
        authorId: number;
        tagNames?: string[];
        isShowcase?: boolean;
    }): Promise<PostWithRelations> {
        const { title, content, imageUrl, authorId, tagNames, isShowcase } = data;

        const includeClause: Prisma.PostInclude = {
            author: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { likes: true, comments: true, favoritedBy: true } },
            tags: { select: { id: true, name: true } }
        };

        let tagOperations: Prisma.PostTagCreateNestedManyWithoutPostsInput | undefined;
        if (tagNames && tagNames.length > 0) {
            tagOperations = {
                connectOrCreate: tagNames.map(name => ({
                    where: { name },
                    create: { name, isFixed: false }, // Assuming new tags are not fixed by default
                })),
            };
        }

        const postData = await prisma.post.create({
            data: {
                title,
                content,
                imageUrl,
                authorId,
                isShowcase: isShowcase ?? false,
                tags: tagOperations, // Connect or create tags
            },
            include: includeClause // Use the includeClause for the returned object
        });

        // Since currentUserId is not passed to createPost directly for likes/favorites status,
        // we process with currentUserId as undefined for now.
        // The creator of the post naturally hasn't liked/favorited it yet in this transaction.
        return this.processPostResult(postData as PostQueryResult, undefined, false);
    }

    static async getAllPosts(options: {
        page?: number; limit?: number; authorId?: number;
        tags?: string[];
        currentUserId?: number | null; sortBy?: 'createdAt' | 'viewCount' | 'likesCount' | 'commentsCount'; sortOrder?: 'asc' | 'desc';
        filter?: 'all' | 'published' | 'showcase'; searchQuery?: string;
    }): Promise<PaginatedPostsResponse> {
        const { page = 1, limit = 10, authorId, tags, currentUserId, sortBy = 'createdAt', sortOrder = 'desc', filter = 'published', searchQuery } = options;
        const skip = (page - 1) * limit;
        const where: Prisma.PostWhereInput = {};

        if (authorId) where.authorId = authorId;
        if (filter === 'published') where.status = 'PUBLISHED';
        if (filter === 'showcase') where.isShowcase = true;

        // 按标签名筛选逻辑
        if (tags && tags.length > 0) {
            const selectedTagName = tags[0]; 
            if (selectedTagName) { // Ensure the tag name is not empty if array wasn't empty
                where.tags = { // 'tags' 是 Post 模型中与 PostTag 的关联字段名
                    some: {
                        name: {
                            equals: selectedTagName, // Use the first tag from the array
                            mode: 'insensitive', // 不区分大小写匹配
                        },
                    },
                };
            }
        }

        if (searchQuery) {
            // 显式声明 searchConditions 的类型
            const searchConditions: Prisma.PostWhereInput[] = [
                { title: { contains: searchQuery, mode: 'insensitive' } },
                { content: { contains: searchQuery, mode: 'insensitive' } },
            ];
            // 如果 where.OR 已存在 (例如被其他条件初始化)，则合并，否则直接赋值
            if (where.OR) {
                where.OR = [...where.OR, ...searchConditions];
            } else {
                where.OR = searchConditions;
            }
        }

        const orderBy: Prisma.PostOrderByWithRelationInput = {};
        if (sortBy === 'viewCount') orderBy.viewCount = sortOrder;
        else if (sortBy === 'likesCount') orderBy.likes = { _count: sortOrder };
        else if (sortBy === 'commentsCount') orderBy.comments = { _count: sortOrder };
        else orderBy.createdAt = sortOrder;

        const includeClause: Prisma.PostInclude = {
            author: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { likes: true, comments: true, favoritedBy: true } },
            tags: { select: { id: true, name: true } } // Include tags
        };

        if (currentUserId) {
            includeClause.likes = { where: { userId: currentUserId }, select: { userId: true } };
            includeClause.favoritedBy = { where: { userId: currentUserId }, select: { userId: true } };
        }

        const postsData = await prisma.post.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: includeClause // Use the constructed includeClause
        });

        const totalCount = await prisma.post.count({ where });
        const posts = postsData.map((p: PostQueryResult) => this.processPostResult(p as PostQueryResult, currentUserId));
        return { posts, totalCount };
    }

    static async getPostById(postId: number, currentUserId?: number | null): Promise<PostWithRelations | null> {
        const postData = await prisma.post.findUnique({
            where: { id: postId, deletedAt: null }, // Ensure not to fetch soft-deleted posts
            include: {
                author: { select: { id: true, name: true, avatarUrl: true } },
                _count: { select: { likes: true, comments: true, favoritedBy: true } },
                likes: currentUserId ? { where: { userId: currentUserId }, select: { userId: true } } : undefined,
                favoritedBy: currentUserId ? { where: { userId: currentUserId }, select: { userId: true } } : undefined,
                tags: { select: { id: true, name: true } } // Include tags
            }
        });

        if (!postData) {
            return null;
        }

        let isFollowingAuthor = false;
        if (currentUserId && postData.authorId && currentUserId !== postData.authorId) {
            const follow = await prisma.follows.findUnique({
                where: { followerId_followingId: { followerId: currentUserId, followingId: postData.authorId } },
            });
            isFollowingAuthor = !!follow;
        }
        return this.processPostResult(postData as PostQueryResult, currentUserId, isFollowingAuthor);
    }

    static async getPostsByUser(userId: number, page: number = 1, limit: number = 10, currentUserId?: number | null): Promise<PaginatedPostsResponse> {
        const skip = (page - 1) * limit;
        const selectClause: Prisma.PostSelect = { // Simplified select
            id: true, title: true, content: true, imageUrl: true, createdAt: true, updatedAt: true, authorId: true, isShowcase: true, viewCount: true, status: true, deletedAt: true,
            author: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { likes: true, comments: true, favoritedBy: true } },
            ...(currentUserId && {
                likes: { where: { userId: currentUserId }, select: { userId: true } },
                favoritedBy: { where: { userId: currentUserId }, select: { userId: true } }
            })
            // No PostTags selection
        };

        const postsData = await prisma.post.findMany({
            where: { authorId: userId, status: 'PUBLISHED' },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: selectClause,
        });

        const totalCount = await prisma.post.count({ where: { authorId: userId, status: 'PUBLISHED' } });
        const posts = postsData.map((p: PostQueryResult) => this.processPostResult(p as PostQueryResult, currentUserId));
        return { posts, totalCount };
    }

    static async getFavoritedPostsByUser(userId: number, page: number = 1, limit: number = 10): Promise<PaginatedPostsResponse> {
        const skip = (page - 1) * limit;
        const favoriteEntries = await prisma.favorite.findMany({
            where: { userId },
            select: { postId: true },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        });
        const postIds = favoriteEntries.map((fav: { postId: number }) => fav.postId);
        if (postIds.length === 0) return { posts: [], totalCount: 0 };

        const selectClause: Prisma.PostSelect = { // Simplified select
            id: true, title: true, content: true, imageUrl: true, createdAt: true, updatedAt: true, authorId: true, isShowcase: true, viewCount: true, status: true, deletedAt: true,
            author: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { likes: true, comments: true, favoritedBy: true } },
            likes: { where: { userId: userId }, select: { userId: true } },
            favoritedBy: { where: { userId: userId }, select: { userId: true } }
            // No PostTags selection
        };

        const postsData = await prisma.post.findMany({
            where: { id: { in: postIds }, status: 'PUBLISHED' }, // Ensure only published posts are shown in favorites too
            select: selectClause,
            orderBy: { createdAt: 'desc' } // or some other relevant order
        });
        const totalCount = await prisma.favorite.count({ where: { userId } }); // Total favorited posts
        const posts = postsData.map((p: PostQueryResult) => this.processPostResult(p as PostQueryResult, userId));
        return { posts, totalCount };
    }

    static async updatePost(postId: number, data: UpdatePostData, userId: number): Promise<PostWithRelations | null> {
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post || post.authorId !== userId) {
            return null;
        }

        const includeClause: Prisma.PostInclude = {
            author: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { likes: true, comments: true, favoritedBy: true } },
            likes: { where: { userId: userId }, select: { userId: true } }, 
            favoritedBy: { where: { userId: userId }, select: { userId: true } }, 
            tags: { select: { id: true, name: true } } 
        };

        // Prepare tag operations if tagNames are provided
        let tagUpdateOperations: Prisma.PostUpdateInput['tags'] | undefined;
        if (data.tagNames !== undefined) { // Check if tagNames is explicitly passed (even if empty array)
            tagUpdateOperations = {
                set: [], // Disconnect all existing tags first
                connectOrCreate: data.tagNames.map(name => ({
                    where: { name },
                    create: { name, isFixed: false }, 
                })),
            };
        }

        const updatedPostData = await prisma.post.update({
            where: { id: postId },
            data: {
                title: data.title,
                content: data.content,
                imageUrl: data.imageUrl,
                isShowcase: data.isShowcase,
                status: data.status,
                tags: tagUpdateOperations, // Apply tag update operations if defined
            },
            include: includeClause, 
        });
        return this.processPostResult(updatedPostData as PostQueryResult, userId);
    }

    static async deletePost(postId: number, userId: number): Promise<Post | null> {
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post || post.authorId !== userId) {
            return null;
        }
        return prisma.post.delete({ where: { id: postId } });
    }

    static async createComment(postId: number, text: string, userId: number): Promise<(Comment & { author: { id: number; name: string | null; avatarUrl: string | null; } }) | null> {
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) {
            return null;
        }

        return prisma.comment.create({
            data: {
                text,
                postId,
                authorId: userId,
            },
            include: {
                author: {
                    select: { id: true, name: true, avatarUrl: true },
                },
            },
        });
    }

    static async getCommentsByPostId(postId: number): Promise<(Comment & { author: { id: number; name: string | null; avatarUrl: string | null; } })[]> {
        return prisma.comment.findMany({
            where: { postId },
            include: {
                author: {
                    select: { id: true, name: true, avatarUrl: true },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }

    static async deleteComment(commentId: number, userId: number): Promise<Comment | null> {
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment || comment.authorId !== userId) {
            return null;
        }
        return prisma.comment.delete({ where: { id: commentId } });
    }
}