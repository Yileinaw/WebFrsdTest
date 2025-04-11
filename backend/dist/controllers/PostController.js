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
exports.PostController = void 0;
const PostService_1 = require("../services/PostService");
const client_1 = require("@prisma/client"); // Import Prisma for error checking
const multer_1 = __importDefault(require("multer")); // Import multer
class PostController {
    // 处理创建帖子的请求
    static createPost(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if Multer middleware added an error to the request
                if (req.multerError) {
                    // Keep this error log
                    console.error('[PostController.createPost] Multer error passed via request:', req.multerError);
                }
                const { title, content } = req.body;
                const authorId = req.userId;
                if (!authorId) {
                    // Keep this error log
                    console.error('[PostController.createPost] Error: authorId not found on request.');
                    res.status(401).json({ message: 'Unauthorized: User ID not found' });
                    return;
                }
                if (!title) {
                    res.status(400).json({ message: 'Title is required' });
                    return;
                }
                let imageUrl = null;
                if (req.file) {
                    const staticUrlPrefix = '/static/images/post/';
                    imageUrl = staticUrlPrefix + req.file.filename;
                    // Keep this log for successful uploads
                    console.log(`[PostController.createPost] Image uploaded. Path: ${req.file.path}, Constructed URL: ${imageUrl}`);
                }
                else {
                    // Optional: Log if no file was uploaded
                    // console.log('[PostController.createPost] No file uploaded with this request.');
                }
                const post = yield PostService_1.PostService.createPost({
                    title,
                    content: content || '',
                    authorId,
                    imageUrl: imageUrl !== null && imageUrl !== void 0 ? imageUrl : undefined
                });
                res.status(201).json({ message: 'Post created successfully', post });
            }
            catch (error) {
                // Keep this error log
                console.error('Create Post Error:', error);
                // Handle Multer errors
                if (error instanceof multer_1.default.MulterError) {
                    // Keep this error log
                    console.error('[PostController.createPost] Caught MulterError:', error.code);
                }
                else if (error.message && error.message.includes('文件类型错误')) {
                    // Keep this error log
                    console.error('[PostController.createPost] Caught File Type Error from fileFilter');
                }
                // Handle Prisma errors
                else if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    res.status(400).json({ message: `Database error: ${error.code}` });
                }
                else {
                    res.status(500).json({ message: 'Internal server error creating post' });
                }
            }
        });
    }
    // 处理获取所有帖子的请求
    static getAllPosts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || undefined;
                const limit = parseInt(req.query.limit) || undefined;
                const sortBy = req.query.sortBy || undefined;
                const currentUserId = req.userId;
                const { posts, totalCount } = yield PostService_1.PostService.getAllPosts({ page, limit, sortBy, currentUserId });
                res.status(200).json({ posts, totalCount });
            }
            catch (error) {
                // Keep this error log
                console.error('Get All Posts Error:', error);
                res.status(500).json({ message: 'Internal server error retrieving posts' });
            }
        });
    }
    // 处理获取单个帖子的请求
    static getPostById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const postId = parseInt(req.params.postId, 10);
                const currentUserId = req.userId;
                if (isNaN(postId)) {
                    res.status(400).json({ message: 'Invalid post ID' });
                    return;
                }
                const post = yield PostService_1.PostService.getPostById(postId, currentUserId);
                if (!post) {
                    res.status(404).json({ message: 'Post not found' });
                    return;
                }
                res.status(200).json({ post });
            }
            catch (error) {
                // Keep this error log
                console.error('Get Post By ID Error:', error);
                res.status(500).json({ message: 'Failed to retrieve post' });
            }
        });
    }
    // 处理更新帖子的请求
    static updatePost(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const postId = parseInt(req.params.postId, 10);
                const { title, content, imageUrl } = req.body;
                const userId = req.userId;
                if (isNaN(postId)) {
                    res.status(400).json({ message: 'Invalid post ID' });
                    return;
                }
                if (!userId) {
                    res.status(401).json({ message: 'Unauthorized: User ID not found' });
                    return;
                }
                if (title === undefined && content === undefined && imageUrl === undefined) {
                    res.status(400).json({ message: 'No update data provided (title, content, or imageUrl)' });
                    return;
                }
                const updateData = {};
                if (title !== undefined)
                    updateData.title = title;
                if (content !== undefined)
                    updateData.content = content;
                if (imageUrl !== undefined)
                    updateData.imageUrl = imageUrl;
                const updatedPost = yield PostService_1.PostService.updatePost(postId, updateData, userId);
                if (!updatedPost) {
                    res.status(404).json({ message: 'Post not found' });
                }
                else {
                    res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
                }
            }
            catch (error) {
                if (error.message.startsWith('Forbidden')) {
                    res.status(403).json({ message: error.message });
                }
                else {
                    // Keep this error log
                    console.error('Update Post Error:', error);
                    res.status(500).json({ message: 'Internal server error updating post' });
                }
            }
        });
    }
    // 处理删除帖子的请求
    static deletePost(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const postId = parseInt(req.params.postId, 10);
                const userId = req.userId;
                if (isNaN(postId)) {
                    res.status(400).json({ message: 'Invalid post ID' });
                    return;
                }
                if (!userId) {
                    res.status(401).json({ message: 'Unauthorized: User ID not found' });
                    return;
                }
                // TODO: Consider deleting associated image file from server storage here
                const deletedPost = yield PostService_1.PostService.deletePost(postId, userId);
                if (!deletedPost) {
                    res.status(404).json({ message: 'Post not found' });
                }
                else {
                    res.status(200).json({ message: 'Post deleted successfully' });
                }
            }
            catch (error) {
                if (error.message.startsWith('Forbidden')) {
                    res.status(403).json({ message: error.message });
                }
                else {
                    // Keep this error log
                    console.error('Delete Post Error:', error);
                    res.status(500).json({ message: 'Internal server error deleting post' });
                }
            }
        });
    }
}
exports.PostController = PostController;
//# sourceMappingURL=PostController.js.map