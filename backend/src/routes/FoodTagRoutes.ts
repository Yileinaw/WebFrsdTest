import { Router } from 'express';
import { getAllTags, updateTag, deleteTag, createTag } from '../controllers/FoodTagController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

const router = Router();

// GET /api/food-tags - 获取所有美食标签
router.get('/', getAllTags);

// POST /api/food-tags - 创建新美食标签 (需要认证)
router.post('/', AuthMiddleware, createTag);

// PUT /api/food-tags/:id - 更新美食标签 (需要认证)
router.put('/:id', AuthMiddleware, updateTag);

// DELETE /api/food-tags/:id - 删除美食标签 (需要认证)
router.delete('/:id', AuthMiddleware, deleteTag);

export default router;
