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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminMiddleware = void 0;
const db_1 = __importDefault(require("../db"));
/**
 * 管理员中间件，检查用户是否具有管理员权限
 * 必须在AuthMiddleware之后使用，因为它依赖于req.userId
 */
const AdminMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[AdminMiddleware] 处理请求: ${req.method} ${req.originalUrl}`);
    try {
        // 用户ID应该已经由AuthMiddleware设置
        if (!req.userId) {
            console.log('[AdminMiddleware] 失败: 未找到用户ID，可能未通过认证');
            res.status(401).json({ message: '未授权访问' });
            return;
        }
        // 从数据库获取用户信息，检查角色
        const user = yield db_1.default.user.findUnique({
            where: { id: req.userId },
            select: { role: true, username: true, email: true }
        });
        if (!user) {
            console.log(`[AdminMiddleware] 失败: 数据库中未找到用户ID ${req.userId}`);
            res.status(401).json({ message: '未授权访问: 用户不存在' });
            return;
        }
        // 检查用户角色
        if (user.role !== 'ADMIN') {
            console.log(`[AdminMiddleware] 失败: 用户 ${user.username || user.email} 不是管理员 (角色: ${user.role})`);
            res.status(403).json({ message: '没有管理员权限' });
            return;
        }
        console.log(`[AdminMiddleware] 成功: 用户 ${user.username || user.email} 是管理员`);
        // 如果是管理员，继续执行
        next();
    }
    catch (error) {
        console.error('[AdminMiddleware] 错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});
exports.AdminMiddleware = AdminMiddleware;
//# sourceMappingURL=AdminMiddleware.js.map