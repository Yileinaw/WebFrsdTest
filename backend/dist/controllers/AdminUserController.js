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
const AdminUserService_1 = __importDefault(require("../services/AdminUserService"));
/**
 * Controller for handling user management requests in the admin panel.
 */
class AdminUserController {
    /**
     * Gets a list of users with pagination and filtering.
     * @param req - Express request object.
     * @param res - Express response object.
     */
    getUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('[AdminUserController] Entering getUsers with query:', req.query);
                const page = parseInt(req.query.page, 10) || 1;
                const limit = parseInt(req.query.limit, 10) || 10;
                const search = req.query.search;
                const role = req.query.role;
                const result = yield AdminUserService_1.default.getUsers({ page, limit, search, role });
                res.json(result);
            }
            catch (error) {
                console.error('Error fetching users:', error);
                res.status(500).json({ message: '获取用户列表失败' });
            }
        });
    }
}
exports.default = new AdminUserController();
//# sourceMappingURL=AdminUserController.js.map