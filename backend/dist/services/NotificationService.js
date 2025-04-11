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
exports.NotificationService = void 0;
const db_1 = __importDefault(require("../db"));
class NotificationService {
    /**
     * Get notifications for a specific user (recipient) with pagination.
     */
    static getNotifications(recipientId_1) {
        return __awaiter(this, arguments, void 0, function* (recipientId, options = {}) {
            const { page = 1, limit = 10, unreadOnly = false } = options;
            const skip = (page - 1) * limit;
            const whereClause = {
                recipientId: recipientId,
            };
            if (unreadOnly) {
                whereClause.isRead = false;
            }
            // Add debug log
            console.log('[DEBUG] getNotifications called with simplified query (no includes).');
            const [notificationsData, totalCount] = yield db_1.default.$transaction([
                db_1.default.notification.findMany({
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
                        }
                    }
                }),
                db_1.default.notification.count({ where: whereClause })
            ]);
            // Map to the BasicNotification structure, ensure type compatibility
            const notifications = notificationsData.map(n => ({
                id: n.id,
                type: n.type, // Type is already NotificationType from select
                isRead: n.isRead,
                createdAt: n.createdAt,
                // senderId: n.senderId, // Keep if needed
                postId: n.postId,
                commentId: n.commentId,
                sender: n.sender ? {
                    id: n.sender.id,
                    name: n.sender.name,
                    avatarUrl: n.sender.avatarUrl
                } : null // Handle case where sender might be null
            }));
            return { notifications, totalCount };
        });
    }
    /**
     * Mark a specific notification as read.
     */
    static markAsRead(recipientId, notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure the notification belongs to the user trying to mark it
            const updatedNotification = yield db_1.default.notification.updateMany({
                where: {
                    id: notificationId,
                    recipientId: recipientId,
                    isRead: false // Only update if it's currently unread
                },
                data: { isRead: true }
            });
            if (updatedNotification.count > 0) {
                return db_1.default.notification.findUnique({ where: { id: notificationId } });
            }
            else {
                return null;
            }
        });
    }
    /**
     * Mark all notifications for a user as read.
     */
    static markAllAsRead(recipientId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db_1.default.notification.updateMany({
                where: {
                    recipientId: recipientId,
                    isRead: false,
                },
                data: { isRead: true },
            });
            return result;
        });
    }
    /**
     * Delete a specific notification.
     */
    static deleteNotification(recipientId, notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const notificationToDelete = yield db_1.default.notification.findFirst({
                where: {
                    id: notificationId,
                    recipientId: recipientId // Verify ownership directly in query
                }
            });
            if (!notificationToDelete) {
                return null;
            }
            yield db_1.default.notification.delete({ where: { id: notificationId } });
            return notificationToDelete;
        });
    }
    /**
    * Delete all notifications for a user.
    */
    static clearAllNotifications(recipientId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db_1.default.notification.deleteMany({
                where: { recipientId: recipientId },
            });
            return result;
        });
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=NotificationService.js.map