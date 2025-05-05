import { Request, Response, NextFunction } from 'express';
import { AdminPostService } from '../services/AdminPostService';

export class AdminPostController {
    /**
     * @description 获取帖子列表 (管理员)
     * @param req 
     * @param res 
     * @param next 
     */
    static async getPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { page = '1', limit = '10', search = '', status = 'ALL' } = req.query;

            const pageNum = parseInt(page as string, 10);
            const limitNum = parseInt(limit as string, 10);

            // --- 调用 Service --- 
            const result = await AdminPostService.getPosts({
                page: pageNum,
                limit: limitNum,
                search: search as string | undefined, // 明确类型
                status: status as string // 传递给 Service 处理 'ALL'
            });

            // --- 返回 Service 结果 ---
            res.status(200).json(result);

        } catch (error) {
            next(error); // 将错误传递给全局错误处理中间件
        }
    }

    /**
     * @description 删除指定帖子 (管理员 - 软删除)
     * @param req 
     * @param res 
     * @param next 
     */
    static async deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const postId = parseInt(id, 10);

            if (isNaN(postId)) {
                res.status(400).json({ message: '无效的帖子 ID' });
                return;
            }

            // --- 调用 Service 执行软删除 ---
            await AdminPostService.deletePost(postId);

            // --- 返回成功信息 ---
            res.status(200).json({ message: `帖子 ${postId} 已成功删除` });

        } catch (error) {
            // 如果 Service 抛出特定错误 (如未找到帖子)，可以捕获并返回 404
            if (error instanceof Error && error.message.includes('未找到 ID 为')) {
                res.status(404).json({ message: error.message });
            } else {
                next(error); // 将其他错误传递给全局错误处理中间件
            }
        }
    }

    // 可选：未来可添加获取单个帖子详情、更新状态等控制器方法
    // static async getPostById(req: Request, res: Response, next: NextFunction): Promise<void> {}
    // static async updatePostStatus(req: Request, res: Response, next: NextFunction): Promise<void> {}
}
