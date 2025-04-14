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
exports.AdminController = void 0;
const AdminService_1 = require("../services/AdminService");
class AdminController {
    // 获取仪表盘统计数据
    static getDashboardStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stats = yield AdminService_1.AdminService.getDashboardStats();
                res.status(200).json(stats);
            }
            catch (error) {
                console.error('[AdminController] Error fetching dashboard stats:', error);
                res.status(500).json({ message: error.message || '获取仪表盘统计数据时发生内部错误' });
            }
        });
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=AdminController.js.map