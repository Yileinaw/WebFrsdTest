import prisma from '../db';
import { Favorite, Post, Prisma, User, Notification } from '@prisma/client';

// console.log('[FavoriteService.ts] File loaded by Node.js process.'); // Remove log

// Define a more specific type for the Author including avatarUrl
interface AuthorInfo {
    id: number;
    name: string | null;
    avatarUrl?: string | null; // Ensure avatarUrl is here
}

// Define a type for Post that includes the AuthorInfo
// This helps ensure type safety throughout the process
interface PostWithAuthor extends Omit<Post, 'authorId'> { 
    author: AuthorInfo | null; 
    likesCount?: number;
    commentsCount?: number;
    favoritesCount?: number; // Ensure this is defined
    isLiked?: boolean; 
    isFavorited?: boolean; 
    isShowcase: boolean; // Add isShowcase here
    viewCount: number;
}

// Define the Paginated response type using PostWithAuthor
interface PaginatedFavoritePostsResponse {
    posts: PostWithAuthor[];
    totalCount: number;
}

export class FavoriteService {

    /**
     * Add a post to user's favorites.
     */
    public static async favoritePost(userId: number, postId: number): Promise<Favorite> {
        const existingFavorite = await prisma.favorite.findUnique({ where: { userId_postId: { userId, postId } } });
        if (existingFavorite) return existingFavorite;

        // Transaction: Create favorite & notification (No count update needed)
        try {
            const [newFavorite, post] = await prisma.$transaction(async (tx) => {
                const favorite = await tx.favorite.create({ data: { userId, postId } });
                // Fetch post author for notification
                const postData = await tx.post.findUnique({ where: { id: postId }, select: { authorId: true } });
                return [favorite, postData];
            });
            
            // Create Notification (Use senderId)
            if (post && post.authorId !== userId) {
                try {
                    await prisma.notification.create({
                        data: { recipientId: post.authorId, senderId: userId, postId, type: 'FAVORITE' }
                    });
                } catch (error) { /* Log notification error */ }
            }
            return newFavorite;
        } catch (error) {
            console.error(`[FavoriteService.favoritePost] Error:`, error);
            throw error; // Re-throw
        }
    }

    /**
     * Remove a post from user's favorites.
     */
    public static async unfavoritePost(userId: number, postId: number): Promise<Favorite | null> {
        // Transaction: Delete favorite (No count update needed)
        try {
            return await prisma.favorite.delete({ where: { userId_postId: { userId, postId } } });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return null; 
            console.error(`[FavoriteService.unfavoritePost] Error:`, error);
            throw error; // Re-throw other errors
        }
    }

    /**
     * Get posts favorited by a specific user with pagination.
     */
    public static async fetchUserFavoritesPage(
        userId: number,
        options: { page?: number, limit?: number } = {}
    ): Promise<PaginatedFavoritePostsResponse> {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;

        // Fetch total count of favorites for the user
        const totalCount = await prisma.favorite.count({
            where: { userId },
        });

        // Fetch paginated favorite records using SELECT to ensure all needed fields are present
        const favoriteRecords = await prisma.favorite.findMany({
            where: { userId },
            select: { // Use select at the top level
                // Select necessary fields from Favorite itself if needed (e.g., createdAt)
                // createdAt: true, 
                post: { // Select the related post data
                   select: { // Explicitly select all fields needed for PostWithAuthor
                       id: true,
                       title: true,
                       content: true,
                       imageUrl: true,
                       createdAt: true,
                       updatedAt: true,
                       isShowcase: true, // Ensure isShowcase is selected
                       author: { // Select author details
                           select: { id: true, name: true, avatarUrl: true }
                       },
                       likes: { // Select likes for the current user
                           where: { userId: userId },
                           select: { id: true } 
                       },
                       _count: { // Select counts
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
        const posts: PostWithAuthor[] = favoriteRecords
            .map(favRecord => {
                // favRecord now only contains the 'post' object based on the select
                const postData = favRecord.post; 
                if (!postData) return null; 

                const authorInfo: AuthorInfo | null = postData.author ? {
                    id: postData.author.id,
                    name: postData.author.name,
                    avatarUrl: postData.author.avatarUrl
                } : null;
                
                // Construct the PostWithAuthor object
                const processedPost: PostWithAuthor = {
                    id: postData.id,
                    title: postData.title,
                    content: postData.content,
                    imageUrl: postData.imageUrl,
                    createdAt: postData.createdAt,
                    updatedAt: postData.updatedAt,
                    author: authorInfo,
                    likesCount: postData._count?.likes ?? 0,
                    commentsCount: postData._count?.comments ?? 0,
                    favoritesCount: postData._count?.favoritedBy ?? 0,
                    isLiked: !!(postData.likes && postData.likes.length > 0),
                    isFavorited: true,
                    isShowcase: postData.isShowcase,
                    viewCount: postData.viewCount ?? 0
                };
                return processedPost;
            })
            .filter((p): p is PostWithAuthor => p !== null);

        return { posts, totalCount };
    }

    /**
     * Get posts favorited by the *currently logged-in* user.
     */
    public static async getMyFavorites(userId: number, options: { page?: number, limit?: number } = {}): Promise<PaginatedFavoritePostsResponse> {
        // Directly call the fetching logic with the logged-in user's ID
        return this.fetchUserFavoritesPage(userId, options);
    }

    /**
     * Get posts favorited by a *specific* user (identified by targetUserId).
     */
    public static async getFavoritesByUserId(targetUserId: number, options: { page?: number, limit?: number } = {}): Promise<PaginatedFavoritePostsResponse> {
        // Directly call the fetching logic with the target user's ID
        return this.fetchUserFavoritesPage(targetUserId, options);
    }
} 