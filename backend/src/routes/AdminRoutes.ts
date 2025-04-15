import express, { Response } from 'express';
import { AdminController } from '../controllers/AdminController';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/AuthMiddleware';
import { AdminMiddleware } from '../middleware/AdminMiddleware';
import prisma from '../db';

const router = express.Router();

// 应用认证和管理员中间件
router.use(AuthMiddleware);
router.use(AdminMiddleware);

// 仪表盘统计数据
router.get('/dashboard/stats', AdminController.getDashboardStats);

// 检查当前用户的角色和权限
router.get('/check-role', (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const userRole = req.userRole;

    console.log(`[AdminRoutes] 检查用户角色: 用户ID ${userId}, 角色: ${userRole}`);

    res.status(200).json({
        userId,
        role: userRole,
        isAdmin: userRole === 'ADMIN',
        isModerator: userRole === 'MODERATOR',
        hasAdminAccess: userRole === 'ADMIN' || userRole === 'MODERATOR'
    });
});

// 用户角色管理（只允许 ADMIN 角色使用）
router.post('/set-role/:userId', async (req: AuthenticatedRequest, res: Response) => {
    try {
        // 验证当前用户是否为 ADMIN
        if (req.userRole !== 'ADMIN') {
            return res.status(403).json({ message: '只有管理员可以设置用户角色' });
        }

        const targetUserId = parseInt(req.params.userId);
        const { role } = req.body;

        // 验证角色是否有效
        if (!['USER', 'MODERATOR', 'ADMIN'].includes(role)) {
            return res.status(400).json({ message: '无效的角色值' });
        }

        // 更新用户角色
        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: { role },
            select: { id: true, username: true, email: true, role: true }
        });

        console.log(`[AdminRoutes] 用户角色已更新: 用户ID ${targetUserId}, 新角色: ${role}`);

        res.status(200).json({
            message: '用户角色已更新',
            user: updatedUser
        });
    } catch (error) {
        console.error('[AdminRoutes] 设置用户角色时出错:', error);
        res.status(500).json({ message: '设置用户角色时出错' });
    }
});

export default router;
