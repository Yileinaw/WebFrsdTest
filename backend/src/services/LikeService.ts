import prisma from '../db';
import { Like, Prisma } from '@prisma/client';

export class LikeService {
    /**
     * Like a post.
     */
    public static async likePost(userId: number, postId: number): Promise<Like | null> {
        const existingLike = await prisma.like.findUnique({
            where: { postId_userId: { postId, userId } } // Correct composite key
        });
        if (existingLike) {
            return existingLike;
        }

        // Transaction: Create Like & Notification (No count update on Post)
        try {
            const [newLike, post] = await prisma.$transaction(async (tx) => {
                const like = await tx.like.create({ data: { userId, postId } });
                // Fetch post author for notification
                const postData = await tx.post.findUnique({ where: { id: postId }, select: { authorId: true } });
                return [like, postData];
            });

            // Create Notification
            if (post && post.authorId !== userId) {
                try {
                    await prisma.notification.create({
                        data: { recipientId: post.authorId, senderId: userId, postId, type: 'LIKE' }
                    });
                } catch (error) {
                    console.error(`[LikeService] Failed to create LIKE notification:`, error);
                }
            }
            return newLike;
        } catch (error) {
            console.error(`[LikeService] Error liking post:`, error);
            // Handle potential transaction errors (e.g., post deleted mid-transaction)
             if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                 throw new Error('Post not found'); 
            }
            throw error; // Re-throw other errors
        }
    }

    /**
     * Unlike a post.
     */
    public static async unlikePost(userId: number, postId: number): Promise<Like | null> {
        // Transaction: Delete Like (No count update on Post)
        try {
            return await prisma.like.delete({
                where: { postId_userId: { postId, userId } } // Correct composite key
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                // Record not found - it wasn't liked anyway
                return null; 
            }
            console.error(`[LikeService] Error unliking post:`, error);
            throw error; // Re-throw other errors
        }
    }
} 