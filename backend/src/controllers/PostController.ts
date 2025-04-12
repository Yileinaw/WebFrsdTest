// src/controllers/PostController.ts
import { Request, Response } from 'express';
import { PostService } from '../services/PostService';
import { AuthenticatedRequest } from '../middleware/AuthMiddleware';
import path from 'path';
import { Prisma } from '@prisma/client';
import multer from 'multer';

export class PostController {
    // 处理创建帖子的请求
    public static async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // Check if Multer middleware added an error to the request
            if ((req as any).multerError) { 
                 // Keep this error log
                 console.error('[PostController.createPost] Multer error passed via request:', (req as any).multerError);
            }

            const authorId = req.userId;
            if (!authorId) {
                 // Keep this error log
                console.error('[PostController.createPost] Error: authorId not found on request.');
                res.status(401).json({ message: 'Unauthorized: User ID not found' });
                return;
            }

            // + Restore old validation
            const { title, content } = req.body;
            if (!title) {
                res.status(400).json({ message: 'Title is required' });
                return;
            }

            let imageUrl: string | null = null; 
            if (req.file) {
                // Correct prefix for the image URL, matching static file serving config
                const uploadUrlPrefix = '/uploads/posts/';
                imageUrl = uploadUrlPrefix + req.file.filename; 
                // Keep this log for successful uploads
                console.log(`[PostController.createPost] Image uploaded. Path: ${req.file.path}, Constructed URL: ${imageUrl}`);
            } else {
                // Optional: Log if no file was uploaded
                // console.log('[PostController.createPost] No file uploaded with this request.');
            }

            const post = await PostService.createPost({
                 title, 
                 content: content || '', 
                 authorId, 
                 imageUrl: imageUrl ?? undefined
            });

            res.status(201).json({ message: 'Post created successfully', post });

        } catch (error: any) {
             // Keep this error log
            console.error('Create Post Error:', error);
            // Handle Multer errors
            if (error instanceof multer.MulterError) {
                 // Keep this error log
                console.error('[PostController.createPost] Caught MulterError:', error.code);
            } else if (error.message && error.message.includes('文件类型错误')) {
                 // Keep this error log
                console.error('[PostController.createPost] Caught File Type Error from fileFilter');
            } 
            // Handle Prisma errors
            else if (error instanceof Prisma.PrismaClientKnownRequestError) {
                 res.status(400).json({ message: `Database error (Code: ${error.code})` }); 
            } else {
                 res.status(500).json({ message: 'Internal server error creating post' });
            }
        }
    }

    // 处理获取所有帖子的请求
    public static async getAllPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // + Restore old parsing
            const page = parseInt(req.query.page as string) || undefined;
            const limit = parseInt(req.query.limit as string) || undefined;
            const sortBy = req.query.sortBy as string || undefined;
            const currentUserId = req.userId;

            const { posts, totalCount } = await PostService.getAllPosts({ page, limit, sortBy, currentUserId });
            res.status(200).json({ posts, totalCount });
        } catch (error: any) {
             // Keep this error log
            console.error('Get All Posts Error:', error);
            res.status(500).json({ message: 'Internal server error retrieving posts' });
        }
    }

    // 处理获取单个帖子的请求
    public static async getPostById(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // + Restore old validation
            const postId = parseInt(req.params.postId, 10);
            if (isNaN(postId)) {
                res.status(400).json({ message: 'Invalid post ID' });
                return;
            }
            const currentUserId = req.userId;

            const post = await PostService.getPostById(postId, currentUserId);
            if (!post) {
                res.status(404).json({ message: 'Post not found' });
                return;
            }
            res.status(200).json({ post });
        } catch (error: any) {
             // Keep this error log
            console.error('Get Post By ID Error:', error);
            res.status(500).json({ message: 'Failed to retrieve post' });
        }
    }

    // 处理更新帖子的请求
    public static async updatePost(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // + Restore old parsing and data extraction
            const postId = parseInt(req.params.postId, 10);
            if (isNaN(postId)) {
                res.status(400).json({ message: 'Invalid post ID' });
                return;
            }
            const { title, content, imageUrl } = req.body;
            const userId = req.userId;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized: User ID not found' });
                return;
            }

            // + Restore old validation for at least one field
            if (title === undefined && content === undefined && imageUrl === undefined) {
                res.status(400).json({ message: 'No update data provided (title, content, or imageUrl)' });
                return;
            }
            
            // + Restore old updateData building
            const updateData: { title?: string; content?: string; imageUrl?: string | null } = {};
            if (title !== undefined) updateData.title = title;
            if (content !== undefined) updateData.content = content;
            if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
            
            const updatedPost = await PostService.updatePost(postId, updateData, userId);
             if (!updatedPost) {
                 // + Restore simpler message
                 res.status(404).json({ message: 'Post not found' }); 
             } else {
                 res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
             }
        } catch (error: any) {
             if (error.message.startsWith('Forbidden')) {
                 res.status(403).json({ message: error.message });
             } 
             else {
                 console.error('Update Post Error:', error);
                 res.status(500).json({ message: 'Internal server error updating post' });
             }
        }
    }

    // 处理删除帖子的请求
    public static async deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // + Restore old validation
            const postId = parseInt(req.params.postId, 10);
             if (isNaN(postId)) {
                 res.status(400).json({ message: 'Invalid post ID' });
                 return;
             }
            const userId = req.userId;
            if (!userId) { 
                res.status(401).json({ message: 'Unauthorized: User ID not found' });
                return;
            }
            
            const deletedPost = await PostService.deletePost(postId, userId);
             if (!deletedPost) {
                 // + Restore simpler message
                 res.status(404).json({ message: 'Post not found' }); 
             } else {
                 res.status(200).json({ message: 'Post deleted successfully'});
             }
        } catch (error: any) {
             if (error.message.startsWith('Forbidden')) {
                 res.status(403).json({ message: error.message });
             } else {
                  // Keep this error log
                 console.error('Delete Post Error:', error);
                 res.status(500).json({ message: 'Internal server error deleting post' });
             }
        }
    }
} 