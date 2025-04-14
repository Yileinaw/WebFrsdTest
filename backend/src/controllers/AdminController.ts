import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';

export class AdminController {
  // 获取仪表盘统计数据
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = await AdminService.getDashboardStats();
      res.status(200).json(stats);
    } catch (error: any) {
      console.error('[AdminController] Error fetching dashboard stats:', error);
      res.status(500).json({ message: error.message || '获取仪表盘统计数据时发生内部错误' });
    }
  }
}
