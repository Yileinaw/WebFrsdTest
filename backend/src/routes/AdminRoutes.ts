import express from 'express';
import { AdminController } from '../controllers/AdminController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { AdminMiddleware } from '../middleware/AdminMiddleware';

const router = express.Router();

// 应用认证和管理员中间件
router.use(AuthMiddleware);
router.use(AdminMiddleware);

// 仪表盘统计数据
router.get('/dashboard/stats', AdminController.getDashboardStats);

export default router;
