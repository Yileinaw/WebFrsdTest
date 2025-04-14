"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentRouter = exports.postRouter = void 0;
// src/routes/PostRoutes.ts
const express_1 = __importDefault(require("express"));
const PostController_1 = require("../controllers/PostController");
const CommentController_1 = require("../controllers/CommentController");
const LikeController_1 = require("../controllers/LikeController"); // Keep LikeController
const FavoriteController_1 = require("../controllers/FavoriteController"); // Keep FavoriteController
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const OptionalAuthMiddleware_1 = require("../middleware/OptionalAuthMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware"); // <-- Import the correct middleware
// --- Remove Basic Multer Config ---
// const basicUpload = multer({ dest: 'uploads/' }); 
// --- End Remove ---
// console.log('[PostRoutes.ts] File loaded'); // Remove log
const postRouter = express_1.default.Router();
exports.postRouter = postRouter;
const commentRouter = express_1.default.Router({ mergeParams: true }); // mergeParams allows access to postId from parent router
exports.commentRouter = commentRouter;
// --- Comment Routes (nested under posts) ---
// POST /api/posts/:postId/comments - Create a comment (requires auth)
commentRouter.post('/', AuthMiddleware_1.AuthMiddleware, CommentController_1.CommentController.createComment);
// GET /api/posts/:postId/comments - Get comments for a post (public, optional auth for future use)
commentRouter.get('/', CommentController_1.CommentController.getCommentsByPostId);
// --- Define specific routes BEFORE routes with parameters ---
// --- Existing post routes --- (Now after /upload-image)
// GET /api/posts - Use Optional Auth
postRouter.get('/', OptionalAuthMiddleware_1.OptionalAuthMiddleware, PostController_1.PostController.getAllPosts);
// POST /api/posts - Use the new uploadPostImage middleware
postRouter.post('/', AuthMiddleware_1.AuthMiddleware, uploadMiddleware_1.uploadPostImage, // <-- Use new middleware for post images
PostController_1.PostController.createPost);
// GET /api/posts/:id - Use Optional Auth
postRouter.get('/:postId', OptionalAuthMiddleware_1.OptionalAuthMiddleware, PostController_1.PostController.getPostById);
// PUT /api/posts/:id - Requires Auth and handle image upload
postRouter.put('/:postId', AuthMiddleware_1.AuthMiddleware, uploadMiddleware_1.uploadPostImage, // <-- Add middleware to handle potential image upload on update
PostController_1.PostController.updatePost);
// DELETE /api/posts/:id - Requires Auth
postRouter.delete('/:postId', AuthMiddleware_1.AuthMiddleware, PostController_1.PostController.deletePost);
// --- Like routes ---
// POST /api/posts/:postId/like - Requires Auth
postRouter.post('/:postId/like', AuthMiddleware_1.AuthMiddleware, LikeController_1.LikeController.likePost);
// DELETE /api/posts/:postId/like - Requires Auth
postRouter.delete('/:postId/like', AuthMiddleware_1.AuthMiddleware, LikeController_1.LikeController.unlikePost);
// --- Favorite Routes ---
// POST /api/posts/:postId/favorite - Requires Auth
postRouter.post('/:postId/favorite', AuthMiddleware_1.AuthMiddleware, FavoriteController_1.FavoriteController.favoritePost);
// DELETE /api/posts/:postId/favorite - Requires Auth
postRouter.delete('/:postId/favorite', AuthMiddleware_1.AuthMiddleware, FavoriteController_1.FavoriteController.unfavoritePost);
// --- End Favorite Routes ---
// --- Separate Comment Deletion Route ---
// DELETE /api/comments/:commentId - Delete a comment (requires auth)
commentRouter.delete('/:commentId', AuthMiddleware_1.AuthMiddleware, CommentController_1.CommentController.deleteComment);
// Mount comment router under post router
postRouter.use('/:postId/comments', commentRouter);
// console.log('[PostRoutes.ts] Exporting routers (Refactored upload)...'); // Remove log 
//# sourceMappingURL=PostRoutes.js.map