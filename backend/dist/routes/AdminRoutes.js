"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AdminController_1 = require("../controllers/AdminController");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const AdminMiddleware_1 = require("../middleware/AdminMiddleware");
const router = express_1.default.Router();
// 应用认证和管理员中间件
router.use(AuthMiddleware_1.AuthMiddleware);
router.use(AdminMiddleware_1.AdminMiddleware);
// 仪表盘统计数据
router.get('/dashboard/stats', AdminController_1.AdminController.getDashboardStats);
exports.default = router;
//# sourceMappingURL=AdminRoutes.js.map