import { Request, Response } from 'express';
import AdminUserService from '../services/AdminUserService';

/**
 * Controller for handling user management requests in the admin panel.
 */
class AdminUserController {
  /**
   * Gets a list of users with pagination and filtering.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      console.log('[AdminUserController] Entering getUsers with query:', req.query);
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;

      const result = await AdminUserService.getUsers({ page, limit, search, role });
      res.json(result);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: '获取用户列表失败' });
    }
  }
}

export default new AdminUserController();
