import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';
import { AuthenticatedRequest } from '../middleware/AuthMiddleware';

export class AdminController {
  // 获取仪表盘统计数据
  static async getDashboardStats(req: Request, res: Response) {
    console.log(`[AdminController] 收到仪表盘统计数据请求: ${req.method} ${req.originalUrl}`);

    try {
      // 检查用户权限
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.userId) {
        console.log('[AdminController] 失败: 未找到用户ID，可能未通过认证');
        return res.status(401).json({ message: '未授权访问' });
      }

      // 获取统计数据
      console.log('[AdminController] 开始获取仪表盘统计数据');
      const stats = await AdminService.getDashboardStats();
      console.log('[AdminController] 成功获取仪表盘统计数据');

      // 返回数据
      res.status(200).json(stats);
    } catch (error: any) {
      console.error('[AdminController] 获取仪表盘统计数据时发生错误:', error);
      res.status(500).json({ message: error.message || '获取仪表盘统计数据时发生内部错误' });
    }
  }
}
