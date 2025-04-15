import { Router } from 'express';
import { getAllTags, updateTag, deleteTag, createTag } from '../controllers/PostTagController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

const router = Router();

// GET /api/post-tags - 获取所有帖子标签
router.get('/', getAllTags);

// POST /api/post-tags - 创建新帖子标签 (需要认证)
router.post('/', AuthMiddleware, createTag);

// PUT /api/post-tags/:id - 更新帖子标签 (需要认证)
router.put('/:id', AuthMiddleware, updateTag);

// DELETE /api/post-tags/:id - 删除帖子标签 (需要认证)
router.delete('/:id', AuthMiddleware, deleteTag);

export default router;
