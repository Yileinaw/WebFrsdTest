import { Response, NextFunction } from 'express';
import prisma from '../db';
import { AuthenticatedRequest } from './AuthMiddleware';

/**
 * 管理员中间件，检查用户是否具有管理员权限
 * 必须在AuthMiddleware之后使用，因为它依赖于req.userId
 */
export const AdminMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    console.log(`[AdminMiddleware] 处理请求: ${req.method} ${req.originalUrl}`);

    try {
        // 用户ID和角色应该已经由AuthMiddleware设置
        if (!req.userId) {
            console.log('[AdminMiddleware] 失败: 未找到用户ID，可能未通过认证');
            res.status(401).json({ message: '未授权访问' });
            return;
        }

        // 直接使用 AuthMiddleware 中设置的 userRole
        console.log(`[AdminMiddleware] 用户角色检查: 用户ID ${req.userId}, 角色: ${req.userRole || '未指定'}`);

        // 如果 userRole 不存在，则从数据库获取用户信息
        if (!req.userRole) {
            console.log(`[AdminMiddleware] 未找到用户角色，从数据库获取`);
            const user = await prisma.user.findUnique({
                where: { id: req.userId },
                select: { role: true, username: true, email: true }
            });

            if (!user) {
                console.log(`[AdminMiddleware] 失败: 数据库中未找到用户ID ${req.userId}`);
                res.status(401).json({ message: '未授权访问: 用户不存在' });
                return;
            }

            req.userRole = user.role;
            console.log(`[AdminMiddleware] 从数据库获取的用户角色: ${user.username || user.email}, 角色: ${user.role}`);
        }

        // 检查用户角色
        // 允许 ADMIN 和 MODERATOR 角色访问管理页面
        if (req.userRole !== 'ADMIN' && req.userRole !== 'MODERATOR') {
            console.log(`[AdminMiddleware] 失败: 用户ID ${req.userId} 不是管理员 (角色: ${req.userRole})`);
            res.status(403).json({ message: '没有管理员权限' });
            return;
        }

        console.log(`[AdminMiddleware] 成功: 用户ID ${req.userId} 是管理员，角色: ${req.userRole}`);

        // 如果是管理员，继续执行
        next();
    } catch (error) {
        console.error('[AdminMiddleware] 错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
};
