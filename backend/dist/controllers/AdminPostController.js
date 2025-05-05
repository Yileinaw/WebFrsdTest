"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPostController = void 0;
const AdminPostService_1 = require("../services/AdminPostService");
class AdminPostController {
    /**
     * @description 获取帖子列表 (管理员)
     * @param req
     * @param res
     * @param next
     */
    static getPosts(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '10', search = '', status = 'ALL' } = req.query;
                const pageNum = parseInt(page, 10);
                const limitNum = parseInt(limit, 10);
                // --- 调用 Service --- 
                const result = yield AdminPostService_1.AdminPostService.getPosts({
                    page: pageNum,
                    limit: limitNum,
                    search: search, // 明确类型
                    status: status // 传递给 Service 处理 'ALL'
                });
                // --- 返回 Service 结果 ---
                res.status(200).json(result);
            }
            catch (error) {
                next(error); // 将错误传递给全局错误处理中间件
            }
        });
    }
    /**
     * @description 删除指定帖子 (管理员 - 软删除)
     * @param req
     * @param res
     * @param next
     */
    static deletePost(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const postId = parseInt(id, 10);
                if (isNaN(postId)) {
                    res.status(400).json({ message: '无效的帖子 ID' });
                    return;
                }
                // --- 调用 Service 执行软删除 ---
                yield AdminPostService_1.AdminPostService.deletePost(postId);
                // --- 返回成功信息 ---
                res.status(200).json({ message: `帖子 ${postId} 已成功删除` });
            }
            catch (error) {
                // 如果 Service 抛出特定错误 (如未找到帖子)，可以捕获并返回 404
                if (error instanceof Error && error.message.includes('未找到 ID 为')) {
                    res.status(404).json({ message: error.message });
                }
                else {
                    next(error); // 将其他错误传递给全局错误处理中间件
                }
            }
        });
    }
}
exports.AdminPostController = AdminPostController;
//# sourceMappingURL=AdminPostController.js.map