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
exports.LikeService = void 0;
const db_1 = __importDefault(require("../db"));
const client_1 = require("@prisma/client");
class LikeService {
    /**
     * Like a post.
     */
    static likePost(userId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingLike = yield db_1.default.like.findUnique({
                where: { postId_userId: { postId, userId } } // Correct composite key
            });
            if (existingLike) {
                return existingLike;
            }
            // Transaction: Create Like & Notification (No count update on Post)
            try {
                const [newLike, post] = yield db_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const like = yield tx.like.create({ data: { userId, postId } });
                    // Fetch post author for notification
                    const postData = yield tx.post.findUnique({ where: { id: postId }, select: { authorId: true } });
                    return [like, postData];
                }));
                // Create Notification
                if (post && post.authorId !== userId) {
                    try {
                        yield db_1.default.notification.create({
                            data: { recipientId: post.authorId, senderId: userId, postId, type: 'LIKE' }
                        });
                    }
                    catch (error) {
                        console.error(`[LikeService] Failed to create LIKE notification:`, error);
                    }
                }
                return newLike;
            }
            catch (error) {
                console.error(`[LikeService] Error liking post:`, error);
                // Handle potential transaction errors (e.g., post deleted mid-transaction)
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    throw new Error('Post not found');
                }
                throw error; // Re-throw other errors
            }
        });
    }
    /**
     * Unlike a post.
     */
    static unlikePost(userId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Transaction: Delete Like (No count update on Post)
            try {
                return yield db_1.default.like.delete({
                    where: { postId_userId: { postId, userId } } // Correct composite key
                });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    // Record not found - it wasn't liked anyway
                    return null;
                }
                console.error(`[LikeService] Error unliking post:`, error);
                throw error; // Re-throw other errors
            }
        });
    }
}
exports.LikeService = LikeService;
//# sourceMappingURL=LikeService.js.map