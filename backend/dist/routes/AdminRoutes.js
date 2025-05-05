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
const express_1 = __importDefault(require("express"));
const AdminController_1 = require("../controllers/AdminController");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const AdminMiddleware_1 = require("../middleware/AdminMiddleware");
const AdminUserController_1 = __importDefault(require("../controllers/AdminUserController"));
const db_1 = __importDefault(require("../db"));
const router = express_1.default.Router();
// 应用认证和管理员中间件
router.use(AuthMiddleware_1.AuthMiddleware);
router.use(AdminMiddleware_1.AdminMiddleware);
// 仪表盘统计数据
router.get('/dashboard/stats', AdminController_1.AdminController.getDashboardStats);
// 检查当前用户的角色和权限
router.get('/check-role', (req, res) => {
    const userId = req.userId;
    const userRole = req.userRole;
    console.log(`[AdminRoutes] 检查用户角色: 用户ID ${userId}, 角色: ${userRole}`);
    res.status(200).json({
        userId,
        role: userRole,
        isAdmin: userRole === 'ADMIN',
        isModerator: userRole === 'MODERATOR',
        hasAdminAccess: userRole === 'ADMIN' || userRole === 'MODERATOR'
    });
});
// 用户角色管理（只允许 ADMIN 角色使用）
router.post('/set-role/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 验证当前用户是否为 ADMIN
        if (req.userRole !== 'ADMIN') {
            return res.status(403).json({ message: '只有管理员可以设置用户角色' });
        }
        const targetUserId = parseInt(req.params.userId);
        const { role } = req.body;
        // 验证角色是否有效
        if (!['USER', 'MODERATOR', 'ADMIN'].includes(role)) {
            return res.status(400).json({ message: '无效的角色值' });
        }
        // 更新用户角色
        const updatedUser = yield db_1.default.user.update({
            where: { id: targetUserId },
            data: { role },
            select: { id: true, username: true, email: true, role: true }
        });
        console.log(`[AdminRoutes] 用户角色已更新: 用户ID ${targetUserId}, 新角色: ${role}`);
        res.status(200).json({
            message: '用户角色已更新',
            user: updatedUser
        });
    }
    catch (error) {
        console.error('[AdminRoutes] 设置用户角色时出错:', error);
        res.status(500).json({ message: '设置用户角色时出错' });
    }
}));
// User Management Routes
router.get('/users', AuthMiddleware_1.isAdmin, AdminUserController_1.default.getUsers);
exports.default = router;
//# sourceMappingURL=AdminRoutes.js.map