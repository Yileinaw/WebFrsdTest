// src/routes/PostRoutes.ts
import express, { Request, Response, NextFunction } from 'express';
import { PostController } from '../controllers/PostController';
import { CommentController } from '../controllers/CommentController';
import { LikeController } from '../controllers/LikeController'; // Keep LikeController
import { FavoriteController } from '../controllers/FavoriteController'; // Keep FavoriteController
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/AuthMiddleware';
import { OptionalAuthMiddleware } from '../middleware/OptionalAuthMiddleware';
import { uploadPostImage } from '../middleware/uploadMiddleware'; // <-- Import the correct middleware
import path from 'path';
import multer from 'multer';

// --- Remove Basic Multer Config ---
// const basicUpload = multer({ dest: 'uploads/' }); 
// --- End Remove ---

// console.log('[PostRoutes.ts] File loaded'); // Remove log

const postRouter = express.Router();
const commentRouter = express.Router({ mergeParams: true }); // mergeParams allows access to postId from parent router

// --- Comment Routes (nested under posts) ---
// POST /api/posts/:postId/comments - Create a comment (requires auth)
commentRouter.post('/', AuthMiddleware, CommentController.createComment);

// GET /api/posts/:postId/comments - Get comments for a post (public, optional auth for future use)
commentRouter.get('/', CommentController.getCommentsByPostId);

// --- Define specific routes BEFORE routes with parameters ---

// --- Existing post routes --- (Now after /upload-image)
// GET /api/posts - Use Optional Auth
postRouter.get('/', OptionalAuthMiddleware, PostController.getAllPosts);

// POST /api/posts - Use the new uploadPostImage middleware
postRouter.post(
    '/', 
    AuthMiddleware,
    uploadPostImage, // <-- Use new middleware for post images
    PostController.createPost
);

// GET /api/posts/:id - Use Optional Auth
postRouter.get('/:postId', OptionalAuthMiddleware, PostController.getPostById);

// PUT /api/posts/:id - Requires Auth and handle image upload
postRouter.put(
    '/:postId', 
    AuthMiddleware, 
    uploadPostImage, // <-- Add middleware to handle potential image upload on update
    PostController.updatePost
);

// DELETE /api/posts/:id - Requires Auth
postRouter.delete('/:postId', AuthMiddleware, PostController.deletePost);

// --- Like routes ---
// POST /api/posts/:postId/like - Requires Auth
postRouter.post('/:postId/like', AuthMiddleware, LikeController.likePost);

// DELETE /api/posts/:postId/like - Requires Auth
postRouter.delete('/:postId/like', AuthMiddleware, LikeController.unlikePost);

// --- Favorite Routes ---
// POST /api/posts/:postId/favorite - Requires Auth
postRouter.post('/:postId/favorite', AuthMiddleware, FavoriteController.favoritePost);

// DELETE /api/posts/:postId/favorite - Requires Auth
postRouter.delete('/:postId/favorite', AuthMiddleware, FavoriteController.unfavoritePost);
// --- End Favorite Routes ---

// --- Separate Comment Deletion Route ---
// DELETE /api/comments/:commentId - Delete a comment (requires auth)
commentRouter.delete('/:commentId', AuthMiddleware, CommentController.deleteComment);

// Mount comment router under post router
postRouter.use('/:postId/comments', commentRouter);

// --- Remove Catch-all --- 

// Export both routers
export { postRouter, commentRouter };
// console.log('[PostRoutes.ts] Exporting routers (Refactored upload)...'); // Remove log 