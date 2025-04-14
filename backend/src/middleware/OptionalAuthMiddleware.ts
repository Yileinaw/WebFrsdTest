import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { AuthenticatedRequest } from './AuthMiddleware'; // Import the extended Request type

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SUPER_SECRET_KEY';

export const OptionalAuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    console.log(`[OptionalAuthMiddleware] 处理请求: ${req.method} ${req.originalUrl}`);
    const authHeader = req.headers.authorization;

    // 只在有认证头且格式正确时处理
    if (authHeader && authHeader.startsWith('Bearer ')) {
        console.log('[OptionalAuthMiddleware] 检测到认证头');
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role?: string };
            console.log(`[OptionalAuthMiddleware] Token解码成功，用户ID: ${decoded.userId}`);

            // 同时验证用户在数据库中是否存在
            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

            if (user) {
                console.log(`[OptionalAuthMiddleware] 用户验证成功: ${user.username || user.email}`);
                req.userId = decoded.userId; // 如果token有效且用户存在，附加userId
            } else {
                console.log(`[OptionalAuthMiddleware] 数据库中未找到用户ID ${decoded.userId}，作为游客处理`);
            }
        } catch (error: any) {
            // 无效token? 忽略，作为游客处理。不发送401。
            console.warn('[OptionalAuthMiddleware] 无效token，作为游客处理:', error.message);
        }
    } else {
        console.log('[OptionalAuthMiddleware] 未提供认证头，作为游客处理');
    }

    // 无论是否认证，总是调用next()
    console.log(`[OptionalAuthMiddleware] 调用next()，用户ID: ${req.userId || '游客'}`);
    next();
};