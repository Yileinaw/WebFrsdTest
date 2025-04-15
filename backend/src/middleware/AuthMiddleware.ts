// src/middleware/AuthMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db'; // 引入 Prisma Client

// 从环境变量获取 JWT 密钥，与 AuthService 保持一致
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SUPER_SECRET_KEY';

// 定义一个接口来扩展 Express 的 Request 类型，以包含 userId 和 userRole
// 添加 export 使其可以被其他模块导入
export interface AuthenticatedRequest extends Request {
    userId?: number; // 将 userId 设为可选，因为并非所有请求都需要它
    userRole?: string; // 添加用户角色信息
}

export const AuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    console.log(`[AuthMiddleware] 处理请求: ${req.method} ${req.originalUrl}`);
    // 1. 获取 Authorization header
    const authHeader = req.headers.authorization;

    // 2. 检查 Header 是否存在且格式正确 (Bearer <token>)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[AuthMiddleware] 失败: 缺失或无效的token格式');
        res.status(401).json({ message: 'Unauthorized: Missing or invalid token format' });
        return;
    }

    // 3. 提取 Token
    const token = authHeader.split(' ')[1];
    console.log(`[AuthMiddleware] 收到token: ${token.substring(0, 10)}...`);

    try {
        // 4. 验证 Token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role?: string; email: string; iat: number; exp: number };
        console.log(`[AuthMiddleware] Token解码成功，用户ID: ${decoded.userId}, 角色: ${decoded.role || '未指定'}`);

        // 5. (可选但推荐) 检查用户是否存在于数据库中
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, username: true, email: true, role: true }
        });

        if (!user) {
            console.log(`[AuthMiddleware] 失败: 数据库中未找到用户ID ${decoded.userId}`);
            res.status(401).json({ message: 'Unauthorized: User not found' });
            return;
        }

        console.log(`[AuthMiddleware] 用户验证成功: ${user.username || user.email}, 角色: ${user.role}`);

        // 6. 将解码出的 userId 和 userRole 附加到请求对象上
        req.userId = decoded.userId;
        req.userRole = user.role; // 使用数据库中的角色，而不是 token 中的角色，更可靠
        console.log(`[AuthMiddleware] 用户ID ${req.userId}, 角色 ${req.userRole} 已附加到请求对象上，调用next()`);

        // 7. 调用 next() 将控制权传递给下一个中间件或路由处理程序
        next();
    } catch (error: any) {
        // Token 验证失败 (例如过期、签名无效等)
        console.error('[AuthMiddleware] 验证错误:', error.message);
        if (error.name === 'TokenExpiredError') {
            console.log('[AuthMiddleware] Token已过期');
            res.status(401).json({ message: 'Unauthorized: Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            console.log('[AuthMiddleware] 无效的Token');
            res.status(401).json({ message: 'Unauthorized: Invalid token' });
        } else {
            console.log('[AuthMiddleware] 未知验证错误');
            res.status(401).json({ message: 'Unauthorized' });
        }
    }
};