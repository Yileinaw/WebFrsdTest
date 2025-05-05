import { Router } from 'express';
import { AdminPostController } from '../controllers/AdminPostController'; // 将在后续步骤创建
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { AdminMiddleware } from '../middleware/AdminMiddleware'; // 确认此中间件已存在且功能正确

const router = Router();

// 对此路由文件下的所有路由应用认证和管理员权限检查中间件
router.use(AuthMiddleware, AdminMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     PostAdminData:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         authorId:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         status:
 *           $ref: '#/components/schemas/PostStatus' # 引用 Prisma 生成的枚举
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         # 根据需要添加其他关联字段，例如作者信息
 *         # author:
 *         #   type: object
 *         #   properties:
 *         #     id:
 *         #       type: integer
 *         #     username:
 *         #       type: string
 * tags:
 *   name: AdminPosts
 *   description: 管理员帖子管理接口
 * /api/admin/posts:
 *   get:
 *     summary: 获取帖子列表 (管理员)
 *     tags: [AdminPosts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词 (标题或内容)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PUBLISHED, DELETED, PENDING, ALL] # 与 PostStatus 枚举保持一致，并添加 ALL
 *         description: 按状态筛选 (PUBLISHED, DELETED, PENDING, 或 ALL 获取所有状态)
 *     responses:
 *       200:
 *         description: 成功获取帖子列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PostAdminData' # 引用上面定义的 Schema
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalPosts:
 *                   type: integer
 *       401:
 *         description: 未授权
 *       403:
 *         description: 禁止访问 (非管理员)
 */
router.get('/', AdminPostController.getPosts); // 控制器方法将在后续步骤创建

/**
 * @swagger
 * /api/admin/posts/{id}:
 *   delete:
 *     summary: 删除指定帖子 (管理员 - 软删除)
 *     tags: [AdminPosts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 要删除的帖子 ID
 *     responses:
 *       200:
 *         description: 帖子已成功标记为删除
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 帖子已删除
 *       400:
 *         description: 无效的帖子 ID
 *       401:
 *         description: 未授权
 *       403:
 *         description: 禁止访问 (非管理员)
 *       404:
 *         description: 帖子未找到
 */
router.delete('/:id', AdminPostController.deletePost); // 控制器方法将在后续步骤创建

// 可选：未来可添加获取单个帖子详情、更新状态等路由
// router.get('/:id', AdminPostController.getPostById);
// router.patch('/:id/status', AdminPostController.updatePostStatus);

export default router;
