import prisma from '../db';
import { Notification, Prisma } from '@prisma/client';

// Define the structure for the response, explicitly listing needed fields
interface BasicNotification {
  id: number;
  type: string; // Use the directly imported enum type
  isRead: boolean;
  createdAt: Date;
  // senderId: number | null; // Keep senderId for filtering/logic if needed, but add sender object
  postId?: number | null;
  commentId?: number | null;
  // Add sender object (adjust structure based on User model)
  sender: {
      id: number;
      name: string | null;
      avatarUrl?: string | null;
  } | null; // Allow sender to be null if senderId is null
  // Add post object for title
  post?: {
      id: number;
      title: string;
  } | null;
}

// Update response interface
interface PaginatedNotificationsResponse {
  notifications: BasicNotification[]; // Use corrected BasicNotification
  totalCount: number;
  unreadCount?: number;
}

export class NotificationService {

  /**
   * Get notifications for a specific user (recipient) with pagination.
   */
  public static async getNotifications(
    recipientId: number,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ): Promise<PaginatedNotificationsResponse> {
    const { page = 1, limit = 10, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.NotificationWhereInput = {
      recipientId: recipientId,
    };
    if (unreadOnly) {
      whereClause.isRead = false;
    }

    // Simplified query without includes if not needed
    // REMOVING the problematic if/else structure introduced in previous edits
    // if (!includeSender && !includePost) { ... } else { ... }

    // Keep only the original logic using $transaction
    // Original debug log (can be manually cleaned later if desired)
    console.log('[DEBUG] getNotifications called with includes query.'); 

    const [notificationsData, totalCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        // Select necessary fields and include sender info
        select: {
            id: true,
            type: true,
            isRead: true,
            createdAt: true,
            senderId: true, // Keep senderId if useful elsewhere
            postId: true,
            commentId: true,
            // Include sender details
            sender: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true
                }
            },
            // Include post details if postId exists
            post: {
                select: {
                    id: true,
                    title: true
                }
            }
        }
      }),
      prisma.notification.count({ where: whereClause })
    ]);

    // Map to the BasicNotification structure, ensure type compatibility
    const notifications: BasicNotification[] = notificationsData.map(n => ({
        id: n.id,
        type: n.type, // Type is already NotificationType from select
        isRead: n.isRead,
        createdAt: n.createdAt,
        // senderId: n.senderId, // Keep if needed
        postId: n.postId,
        commentId: n.commentId,
        sender: n.sender ? { // Map the sender object
            id: n.sender.id,
            name: n.sender.name,
            avatarUrl: n.sender.avatarUrl
        } : null, // Handle case where sender might be null
        // Map the post object
        post: n.post ? {
            id: n.post.id,
            title: n.post.title
        } : null
    }));

    return { notifications, totalCount };
  }

  /**
   * Mark a specific notification as read.
   */
  public static async markAsRead(recipientId: number, notificationId: number): Promise<Notification | null> {
    // Ensure the notification belongs to the user trying to mark it
    const updatedNotification = await prisma.notification.updateMany({
        where: {
            id: notificationId,
            recipientId: recipientId,
            isRead: false // Only update if it's currently unread
        },
        data: { isRead: true }
    });
    
     if (updatedNotification.count > 0) {
         return prisma.notification.findUnique({ where: { id: notificationId } });
     } else {
        return null;
     }
  }

  /**
   * Mark all notifications for a user as read.
   */
  public static async markAllAsRead(recipientId: number): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: {
        recipientId: recipientId,
        isRead: false,
      },
      data: { isRead: true },
    });
    return result; 
  }

  /**
   * Delete a specific notification.
   */
  public static async deleteNotification(recipientId: number, notificationId: number): Promise<Notification | null> {
    const notificationToDelete = await prisma.notification.findFirst({
        where: { 
            id: notificationId,
            recipientId: recipientId // Verify ownership directly in query
         }
    });

    if (!notificationToDelete) {
        return null; 
    }

    await prisma.notification.delete({ where: { id: notificationId } });

    return notificationToDelete; 
  }

   /**
   * Delete all notifications for a user.
   */
  public static async clearAllNotifications(recipientId: number): Promise<{ count: number }> {
    const result = await prisma.notification.deleteMany({
      where: { recipientId: recipientId },
    });
    return result; 
  }
} 