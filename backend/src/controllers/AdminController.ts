import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';
import { AuthenticatedRequest } from '../middleware/AuthMiddleware';
import os from 'os'; // Import the 'os' module

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

  // 新增：获取系统信息
  static async getSystemInfo(req: Request, res: Response) {
    console.log(`[AdminController] 收到系统信息请求: ${req.method} ${req.originalUrl}`);
    try {
      // 权限已由 AdminMiddleware 检查

      const systemInfo = {
        nodeVersion: process.version, // 获取 Node.js 版本
        platform: os.platform(), // 获取操作系统平台
        osType: os.type(), // 获取操作系统类型 (e.g., Windows_NT, Linux)
        osRelease: os.release(), // 获取操作系统版本
        // 可以根据需要添加更多信息，如 CPU, memory (os.cpus(), os.totalmem(), os.freemem())
        // 但要注意性能影响和信息敏感性
      };

      console.log('[AdminController] 成功获取系统信息:', systemInfo);
      res.status(200).json(systemInfo);

    } catch (error: any) {
      console.error('[AdminController] 获取系统信息时发生错误:', error);
      res.status(500).json({ message: error.message || '获取系统信息时发生内部错误' });
    }
  }

  // 新增：清除缓存（占位符）
  static async clearCache(req: Request, res: Response) {
    console.log(`[AdminController] 收到清除缓存请求: ${req.method} ${req.originalUrl}`);
    try {
      // 权限已由 AdminMiddleware 检查
      console.warn('[AdminController] 清除缓存功能尚未实现');
      res.status(501).json({ message: '清除缓存功能尚未实现' });
      // TODO: 实现具体的缓存清除逻辑
    } catch (error: any) {
      console.error('[AdminController] 清除缓存时发生错误:', error);
      res.status(500).json({ message: error.message || '清除缓存时发生内部错误' });
    }
  }

  // 新增：获取活动日志（占位符）
  static async getActivityLogs(req: Request, res: Response) {
    console.log(`[AdminController] 收到获取活动日志请求: ${req.method} ${req.originalUrl}`);
    try {
      // 权限已由 AdminMiddleware 检查
      console.warn('[AdminController] 获取活动日志功能尚未实现');
      res.status(501).json({ message: '获取活动日志功能尚未实现' });
      // TODO: 实现获取活动日志的逻辑，包括分页、筛选等
    } catch (error: any) {
      console.error('[AdminController] 获取活动日志时发生错误:', error);
      res.status(500).json({ message: error.message || '获取活动日志时发生内部错误' });
    }
  }
}
