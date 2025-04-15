// src/controllers/PostController.ts
import { Request, Response } from 'express';
import { PostService } from '../services/PostService';
import { AuthenticatedRequest } from '../middleware/AuthMiddleware';
import path from 'path';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { supabase } from '../lib/supabaseClient'; // <-- Import Supabase client
import prisma from '../db'; // <-- Import prisma client for direct access if needed

export class PostController {
    // 处理创建帖子的请求 (集成 Supabase)
    public static async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const authorId = req.userId;
            if (!authorId) {
                console.error('[PostController.createPost] Error: authorId not found on request.');
                res.status(401).json({ message: 'Unauthorized: User ID not found' });
                return;
            }

            const { title, content, tags } = req.body; // Include tags if sent in body
            if (!title) {
                res.status(400).json({ message: 'Title is required' });
                return;
            }

            let imageUrl: string | undefined = undefined; // Use undefined initially
            const bucketName = process.env.SUPABASE_BUCKET_NAME;

            // --- Handle Image Upload (if file exists) ---
            if (req.file && bucketName) {
                console.log(`[PostController.createPost] Received file for upload: ${req.file.originalname}`);
                const fileBuffer = req.file.buffer;
                const originalName = req.file.originalname;
                const fileExt = path.extname(originalName);
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                // Use authorId in filename for better organization
                const fileName = `post-${authorId}-${uniqueSuffix}${fileExt}`;
                const filePath = `post-images/${fileName}`; // Path within the Supabase bucket

                // Upload to Supabase
                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, fileBuffer, {
                        contentType: req.file.mimetype,
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error(`[PostController.createPost] Supabase upload error for user ${authorId}:`, uploadError);
                    imageUrl = undefined; // Ensure imageUrl is undefined on error
                    console.warn(`[PostController.createPost] Post created for user ${authorId}, but Supabase image upload failed.`); // Log warning instead
                } else {
                    // Get public URL
                    const { data: urlData } = supabase.storage
                        .from(bucketName)
                        .getPublicUrl(filePath);

                    if (urlData?.publicUrl) {
                        imageUrl = urlData.publicUrl;
                        console.log(`[PostController.createPost] Image uploaded to Supabase. URL: ${imageUrl}`);
                    } else {
                         console.error(`[PostController.createPost] Failed to get public URL from Supabase for path: ${filePath}`);
                         imageUrl = undefined;
                         console.warn(`[PostController.createPost] Post created for user ${authorId}, but failed to get Supabase public URL.`); // Log warning instead
                    }
                }
            } else if (req.file && !bucketName) {
                 console.error('[PostController.createPost] File uploaded but Supabase bucket name not configured.');
                 console.warn(`[PostController.createPost] Post created for user ${authorId}, but Supabase bucket name not configured.`); // Log warning instead
            }
            // --- End Image Upload Handling ---

            // Parse tags if provided (assuming comma-separated string or array)
            let tagNames: string[] = [];
            if (typeof tags === 'string') {
                tagNames = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            } else if (Array.isArray(tags)) {
                tagNames = tags.filter(tag => typeof tag === 'string');
            }

            const post = await PostService.createPost({
                 title,
                 content: content || '',
                 authorId,
                 imageUrl: imageUrl, // Pass the Supabase URL or undefined
                 tagNames: tagNames.length > 0 ? tagNames : undefined // Pass parsed tags
            });

            res.status(201).json({ message: 'Post created successfully', post });

        } catch (error: any) {
            console.error('Create Post Error:', error);
            // Handle Prisma errors specifically if needed
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                 res.status(400).json({ message: `数据库错误 (Code: ${error.code})` });
            } else if (error.message?.includes('标签不存在')) {
                res.status(400).json({ message: error.message });
            } else {
                 res.status(500).json({ message: '创建帖子时发生内部错误' });
            }
        }
    }

    // 处理获取所有帖子的请求
    public static async getAllPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // 解析查询参数
            const page = parseInt(req.query.page as string) || undefined;
            const limit = parseInt(req.query.limit as string) || undefined;
            const sortBy = req.query.sortBy as string || undefined;
            const search = req.query.search as string || undefined;
            const showcase = req.query.showcase === 'true' ? true : undefined;
            const currentUserId = req.userId;

            // 处理标签筛选
            let tags: string[] | undefined = undefined;
            if (req.query.tags) {
                if (Array.isArray(req.query.tags)) {
                    tags = req.query.tags as string[];
                } else if (typeof req.query.tags === 'string') {
                    tags = (req.query.tags as string).split(',').map(tag => tag.trim()).filter(Boolean);
                }
            }

            const { posts, totalCount } = await PostService.getAllPosts({
                page,
                limit,
                sortBy,
                search,
                showcase,
                tags,
                currentUserId
            });

            res.status(200).json({ posts, totalCount });
        } catch (error: any) {
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

    // 处理更新帖子的请求 (集成 Supabase)
    public static async updatePost(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const postId = parseInt(req.params.postId, 10);
            if (isNaN(postId)) {
                res.status(400).json({ message: 'Invalid post ID' });
                return;
            }
            // Explicitly check for `imageUrl === null` in the body
            const { title, content, tags, imageUrl: imageUrlFromBody } = req.body;
            const userId = req.userId;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized: User ID not found' });
                return;
            }

            // Ensure at least one field is being updated
            if (title === undefined && content === undefined && tags === undefined && imageUrlFromBody === undefined && !req.file) {
                res.status(400).json({ message: '未提供任何更新数据' });
                return;
            }

            const bucketName = process.env.SUPABASE_BUCKET_NAME;
            let newImageUrl: string | null | undefined = undefined; // undefined means no change, null means remove, string is new URL
            let oldSupabasePathToDelete: string | null = null;

            // --- Fetch old post data first to get oldImageUrl ---
            const oldPost = await prisma.post.findUnique({ // Use prisma directly or add method to service
                where: { id: postId },
                select: { imageUrl: true, authorId: true }
            });

            if (!oldPost) {
                res.status(404).json({ message: 'Post not found' });
                return;
            }
             // Check ownership
            if (oldPost.authorId !== userId) {
                 res.status(403).json({ message: 'Forbidden: You do not own this post' });
                 return;
            }
            const oldImageUrl = oldPost.imageUrl;

            // --- Handle Image Upload/Removal ---
            if (req.file && bucketName) {
                // --- Uploading a new image ---
                console.log(`[PostController.updatePost] Received new file for post ${postId}: ${req.file.originalname}`);
                const fileBuffer = req.file.buffer;
                const originalName = req.file.originalname;
                const fileExt = path.extname(originalName);
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const fileName = `post-${postId}-${uniqueSuffix}${fileExt}`; // Use postId now
                const filePath = `post-images/${fileName}`;

                // Upload new file
                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, fileBuffer, { contentType: req.file.mimetype, cacheControl: '3600', upsert: false });

                if (uploadError) {
                     console.error(`[PostController.updatePost] Supabase upload error for post ${postId}:`, uploadError);
                     // Fail the update if image upload fails?
                     res.status(500).json({ message: '更新帖子时图片上传失败', error: uploadError.message });
                     return;
                } else {
                    // Get new public URL
                    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
                    if (urlData?.publicUrl) {
                        newImageUrl = urlData.publicUrl; // Set the new URL
                        console.log(`[PostController.updatePost] New image uploaded. URL: ${newImageUrl}`);
                        // Prepare to delete the old one if it existed
                        if (oldImageUrl && oldImageUrl.includes(process.env.SUPABASE_URL ?? 'supabase.co')) {
                            try {
                                const url = new URL(oldImageUrl);
                                const pathSegments = url.pathname.split('/');
                                const bnIndex = pathSegments.findIndex(s => s === bucketName);
                                if (bnIndex > -1 && pathSegments.length > bnIndex + 1 && pathSegments[bnIndex+1] === 'post-images') {
                                    oldSupabasePathToDelete = pathSegments.slice(bnIndex + 1).join('/');
                                }
                            } catch (e) { console.error(`[PostController.updatePost] Failed to parse old URL ${oldImageUrl}`); }
                        }
                    } else {
                         console.error(`[PostController.updatePost] Failed to get public URL for new image: ${filePath}`);
                         res.status(500).json({ message: '获取新图片链接失败' });
                         return;
                    }
                }
            } else if (imageUrlFromBody === null) {
                 // --- Removing the image ---
                 console.log(`[PostController.updatePost] Request to remove image for post ${postId}`);
                 newImageUrl = null; // Explicitly set to null for update
                 // Prepare to delete the old one if it existed
                 if (oldImageUrl && oldImageUrl.includes(process.env.SUPABASE_URL ?? 'supabase.co') && bucketName) {
                     try {
                         const url = new URL(oldImageUrl);
                         const pathSegments = url.pathname.split('/');
                         const bnIndex = pathSegments.findIndex(s => s === bucketName);
                         if (bnIndex > -1 && pathSegments.length > bnIndex + 1 && pathSegments[bnIndex+1] === 'post-images') {
                             oldSupabasePathToDelete = pathSegments.slice(bnIndex + 1).join('/');
                         }
                     } catch (e) { console.error(`[PostController.updatePost] Failed to parse old URL ${oldImageUrl}`); }
                 }
            } else if (req.file && !bucketName) {
                 console.error('[PostController.updatePost] File uploaded but Supabase bucket name not configured.');
                 res.status(500).json({ message: '图片上传服务未配置' });
                 return;
            }
            // --- End Image Upload/Removal ---

            // Build update data for the service
            const updateData: { title?: string; content?: string; imageUrl?: string | null; tagNames?: string[] } = {};
            if (title !== undefined) updateData.title = title;
            if (content !== undefined) updateData.content = content;
            // Only include imageUrl in updateData if it changed (new URL or null)
            if (newImageUrl !== undefined) {
                updateData.imageUrl = newImageUrl;
            }
            // Parse tags if provided
             if (tags !== undefined) {
                 let tagNames: string[] = [];
                 if (typeof tags === 'string') {
                     tagNames = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
                 } else if (Array.isArray(tags)) {
                     tagNames = tags.filter(tag => typeof tag === 'string');
                 }
                 updateData.tagNames = tagNames;
             }

            // If only tags are updated, updateData might be empty apart from tagNames
            if (Object.keys(updateData).length === 0) {
                 res.status(400).json({ message: '未提供有效的更新数据' });
                 return;
            }

            // --- Call Service to update Post ---
            const updatedPost = await PostService.updatePost(postId, updateData, userId);
            // --- End Update ---

            // --- Delete old image AFTER successful DB update ---
            if (oldSupabasePathToDelete && bucketName) {
                 console.log(`[PostController.updatePost] Attempting to delete old Supabase image: ${oldSupabasePathToDelete}`);
                 const { error: deleteError } = await supabase.storage.from(bucketName).remove([oldSupabasePathToDelete]);
                 if (deleteError) {
                     console.error(`[PostController.updatePost] Failed to delete old image ${oldSupabasePathToDelete}:`, deleteError);
                     // Don't fail the request, but maybe log or notify?
                 } else {
                     console.log(`[PostController.updatePost] Successfully deleted old image: ${oldSupabasePathToDelete}`);
                 }
             }
            // --- End Delete Old Image ---

            res.status(200).json({ message: 'Post updated successfully', post: updatedPost });

        } catch (error: any) {
             if (error.message.startsWith('Forbidden')) {
                 res.status(403).json({ message: error.message });
             } else if (error.message?.includes('标签不存在')) {
                res.status(400).json({ message: error.message });
            } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                 // Handle case where the post might have been deleted between check and update
                 res.status(404).json({ message: 'Post not found' });
             } else {
                 console.error('Update Post Error:', error);
                 res.status(500).json({ message: '更新帖子时发生内部错误' });
             }
        }
    }

    // 处理带图片的帖子更新请求
    public static async updatePostWithImage(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const postId = parseInt(req.params.postId, 10);
            if (isNaN(postId)) {
                res.status(400).json({ message: 'Invalid post ID' });
                return;
            }

            const { title, content, tags } = req.body;
            const userId = req.userId;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized: User ID not found' });
                return;
            }

            // 确保至少提供了一个要更新的字段
            if (title === undefined && content === undefined && tags === undefined && !req.file) {
                res.status(400).json({ message: '未提供任何更新数据' });
                return;
            }

            const bucketName = process.env.SUPABASE_BUCKET_NAME;
            let newImageUrl: string | null | undefined = undefined; // undefined表示不变，null表示移除，字符串是新URL
            let oldSupabasePathToDelete: string | null = null;

            // 先获取旧帖子数据以获取oldImageUrl
            const oldPost = await prisma.post.findUnique({
                where: { id: postId },
                select: { imageUrl: true, authorId: true }
            });

            if (!oldPost) {
                res.status(404).json({ message: 'Post not found' });
                return;
            }

            // 检查所有权
            if (oldPost.authorId !== userId) {
                res.status(403).json({ message: 'Forbidden: You do not own this post' });
                return;
            }

            const oldImageUrl = oldPost.imageUrl;

            // 处理图片上传/移除
            if (req.file && bucketName) {
                // 上传新图片
                console.log(`[PostController.updatePostWithImage] Received new file for post ${postId}: ${req.file.originalname}`);
                const fileBuffer = req.file.buffer;
                const originalName = req.file.originalname;
                const fileExt = path.extname(originalName);
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const fileName = `post-${postId}-${uniqueSuffix}${fileExt}`;
                const filePath = `post-images/${fileName}`;

                // 上传新文件
                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, fileBuffer, { contentType: req.file.mimetype, cacheControl: '3600', upsert: false });

                if (uploadError) {
                    console.error(`[PostController.updatePostWithImage] Supabase upload error for post ${postId}:`, uploadError);
                    res.status(500).json({ message: '更新帖子时图片上传失败', error: uploadError.message });
                    return;
                } else {
                    // 获取新的公共URL
                    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
                    if (urlData?.publicUrl) {
                        newImageUrl = urlData.publicUrl; // 设置新URL
                        console.log(`[PostController.updatePostWithImage] New image uploaded. URL: ${newImageUrl}`);

                        // 准备删除旧图片（如果存在）
                        if (oldImageUrl && oldImageUrl.includes(process.env.SUPABASE_URL ?? 'supabase.co')) {
                            try {
                                const url = new URL(oldImageUrl);
                                const pathSegments = url.pathname.split('/');
                                const bnIndex = pathSegments.findIndex(s => s === bucketName);
                                if (bnIndex > -1 && pathSegments.length > bnIndex + 1 && pathSegments[bnIndex+1] === 'post-images') {
                                    oldSupabasePathToDelete = pathSegments.slice(bnIndex + 1).join('/');
                                }
                            } catch (e) { console.error(`[PostController.updatePostWithImage] Failed to parse old URL ${oldImageUrl}`); }
                        }
                    } else {
                        console.error(`[PostController.updatePostWithImage] Failed to get public URL for new image: ${filePath}`);
                        res.status(500).json({ message: '获取新图片链接失败' });
                        return;
                    }
                }
            } else if (req.body.removeImage === 'true') {
                // 移除图片
                console.log(`[PostController.updatePostWithImage] Request to remove image for post ${postId}`);
                newImageUrl = null; // 显式设置为null以进行更新

                // 准备删除旧图片（如果存在）
                if (oldImageUrl && oldImageUrl.includes(process.env.SUPABASE_URL ?? 'supabase.co') && bucketName) {
                    try {
                        const url = new URL(oldImageUrl);
                        const pathSegments = url.pathname.split('/');
                        const bnIndex = pathSegments.findIndex(s => s === bucketName);
                        if (bnIndex > -1 && pathSegments.length > bnIndex + 1 && pathSegments[bnIndex+1] === 'post-images') {
                            oldSupabasePathToDelete = pathSegments.slice(bnIndex + 1).join('/');
                        }
                    } catch (e) { console.error(`[PostController.updatePostWithImage] Failed to parse old URL ${oldImageUrl}`); }
                }
            } else if (req.file && !bucketName) {
                console.error('[PostController.updatePostWithImage] File uploaded but Supabase bucket name not configured.');
                res.status(500).json({ message: '图片上传服务未配置' });
                return;
            }

            // 构建更新数据
            const updateData: { title?: string; content?: string; imageUrl?: string | null; tagNames?: string[] } = {};
            if (title !== undefined) updateData.title = title;
            if (content !== undefined) updateData.content = content;

            // 仅当图片发生变化时才包含imageUrl
            if (newImageUrl !== undefined) {
                updateData.imageUrl = newImageUrl;
            }

            // 解析标签（如果提供）
            if (tags !== undefined) {
                let tagNames: string[] = [];
                if (typeof tags === 'string') {
                    tagNames = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
                } else if (Array.isArray(tags)) {
                    tagNames = tags.filter(tag => typeof tag === 'string');
                }
                updateData.tagNames = tagNames;
            }

            // 如果除了标签外没有其他更新数据，updateData可能为空
            if (Object.keys(updateData).length === 0) {
                res.status(400).json({ message: '未提供有效的更新数据' });
                return;
            }

            // 调用服务更新帖子
            const updatedPost = await PostService.updatePost(postId, updateData, userId);

            // 成功更新数据库后删除旧图片
            if (oldSupabasePathToDelete && bucketName) {
                console.log(`[PostController.updatePostWithImage] Attempting to delete old Supabase image: ${oldSupabasePathToDelete}`);
                const { error: deleteError } = await supabase.storage.from(bucketName).remove([oldSupabasePathToDelete]);
                if (deleteError) {
                    console.error(`[PostController.updatePostWithImage] Failed to delete old image ${oldSupabasePathToDelete}:`, deleteError);
                } else {
                    console.log(`[PostController.updatePostWithImage] Successfully deleted old image: ${oldSupabasePathToDelete}`);
                }
            }

            res.status(200).json({ message: 'Post updated successfully', post: updatedPost });

        } catch (error: any) {
            if (error.message.startsWith('Forbidden')) {
                res.status(403).json({ message: error.message });
            } else if (error.message?.includes('标签不存在')) {
                res.status(400).json({ message: error.message });
            } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                res.status(404).json({ message: 'Post not found' });
            } else {
                console.error('Update Post With Image Error:', error);
                res.status(500).json({ message: '更新帖子时发生内部错误' });
            }
        }
    }

    // 处理删除帖子的请求 (添加 Supabase 图片删除)
    public static async deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
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

            const bucketName = process.env.SUPABASE_BUCKET_NAME;
            let supabasePathToDelete: string | null = null;

            // 1. Fetch post to check ownership and get imageUrl BEFORE deleting
            const postToDelete = await prisma.post.findUnique({
                where: { id: postId },
                select: { authorId: true, imageUrl: true }
            });

            if (!postToDelete) {
                res.status(404).json({ message: 'Post not found' });
                return;
            }

            if (postToDelete.authorId !== userId) {
                res.status(403).json({ message: 'Forbidden: You do not own this post' });
                return;
            }

            const oldImageUrl = postToDelete.imageUrl;

            // 2. Prepare Supabase path if image exists and is on Supabase
             if (oldImageUrl && oldImageUrl.includes(process.env.SUPABASE_URL ?? 'supabase.co') && bucketName) {
                 try {
                     const url = new URL(oldImageUrl);
                     const pathSegments = url.pathname.split('/');
                     const bnIndex = pathSegments.findIndex(s => s === bucketName);
                     // Check if it's in the post-images folder
                     if (bnIndex > -1 && pathSegments.length > bnIndex + 1 && pathSegments[bnIndex+1] === 'post-images') {
                         supabasePathToDelete = pathSegments.slice(bnIndex + 1).join('/');
                     }
                 } catch (e) {
                     console.error(`[PostController.deletePost] Failed to parse old image URL ${oldImageUrl} for post ${postId}`);
                     // Don't block deletion if URL parsing fails
                 }
             }

            // 3. Call service to delete the post from the database
            const deletedPostResult = await PostService.deletePost(postId, userId); // Service now mainly confirms ownership again and deletes

             // 4. If DB deletion was successful, attempt to delete Supabase image
             if (deletedPostResult) { // Check if deletion was successful (service returns non-null)
                 if (supabasePathToDelete) {
                     console.log(`[PostController.deletePost] Attempting to delete Supabase image: ${supabasePathToDelete}`);
                     const { error: deleteError } = await supabase.storage.from(bucketName!).remove([supabasePathToDelete]); // Use ! as bucketName checked
                     if (deleteError) {
                         console.error(`[PostController.deletePost] Failed to delete Supabase image ${supabasePathToDelete}:`, deleteError);
                     } else {
                         console.log(`[PostController.deletePost] Successfully deleted Supabase image: ${supabasePathToDelete}`);
                     }
                 }
                 res.status(200).json({ message: 'Post deleted successfully'});
             } else {
                 // This case might happen if the service layer finds the post wasn't found
                 // or ownership failed again, although controller check should prevent this.
                 res.status(404).json({ message: 'Post not found or deletion failed' });
             }
        } catch (error: any) {
             // Keep existing error handling for Forbidden errors from service or other errors
             if (error.message.startsWith('Forbidden')) {
                 res.status(403).json({ message: error.message });
             } else {
                 console.error('Delete Post Error:', error);
                 res.status(500).json({ message: 'Internal server error deleting post' });
             }
        }
    }
}