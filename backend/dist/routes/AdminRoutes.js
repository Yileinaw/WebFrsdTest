"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AdminController_1 = require("../controllers/AdminController");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const AdminMiddleware_1 = require("../middleware/AdminMiddleware");
const router = (0, express_1.Router)();
// 所有管理员路由都需要认证和管理员权限
router.use(AuthMiddleware_1.AuthMiddleware);
router.use(AdminMiddleware_1.AdminMiddleware);
// GET /api/admin/dashboard/stats - 获取仪表盘统计数据
router.get('/dashboard/stats', AdminController_1.AdminController.getDashboardStats);
exports.default = router;
//# sourceMappingURL=AdminRoutes.js.map