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
exports.isAdmin = exports.AuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../db")); // 引入 Prisma Client
// 从环境变量获取 JWT 密钥，与 AuthService 保持一致
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SUPER_SECRET_KEY';
const AuthMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[AuthMiddleware] 处理请求: ${req.method} ${req.originalUrl}`);
    // 1. 获取 Authorization header
    const authHeader = req.headers.authorization;
    // 2. 检查 Header 是否存在且格式正确 (Bearer <token>)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[AuthMiddleware] 失败: 缺失或无效的token格式');
        res.status(401).json({ message: 'Unauthorized: Missing or invalid token format' });
        return;
    }
    // 3. 提取 Token
    const token = authHeader.split(' ')[1];
    console.log(`[AuthMiddleware] 收到token: ${token.substring(0, 10)}...`);
    try {
        // 4. 验证 Token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        console.log(`[AuthMiddleware] Token解码成功，用户ID: ${decoded.userId}, 角色: ${decoded.role || '未指定'}`);
        // 5. (可选但推荐) 检查用户是否存在于数据库中
        const user = yield db_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, username: true, email: true, role: true }
        });
        if (!user) {
            console.log(`[AuthMiddleware] 失败: 数据库中未找到用户ID ${decoded.userId}`);
            res.status(401).json({ message: 'Unauthorized: User not found' });
            return;
        }
        console.log(`[AuthMiddleware] 用户验证成功: ${user.username || user.email}, 角色: ${user.role}`);
        // 6. 将解码出的 userId 和 userRole 附加到请求对象上
        req.userId = decoded.userId;
        req.userRole = user.role; // 使用数据库中的角色，而不是 token 中的角色，更可靠
        console.log(`[AuthMiddleware] 用户ID ${req.userId}, 角色 ${req.userRole} 已附加到请求对象上，调用next()`);
        // 7. 调用 next() 将控制权传递给下一个中间件或路由处理程序
        next();
    }
    catch (error) {
        // Token 验证失败 (例如过期、签名无效等)
        console.error('[AuthMiddleware] 验证错误:', error.message);
        if (error.name === 'TokenExpiredError') {
            console.log('[AuthMiddleware] Token已过期');
            res.status(401).json({ message: 'Unauthorized: Token expired' });
        }
        else if (error.name === 'JsonWebTokenError') {
            console.log('[AuthMiddleware] 无效的Token');
            res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
        else {
            console.log('[AuthMiddleware] 未知验证错误');
            res.status(401).json({ message: 'Unauthorized' });
        }
    }
});
exports.AuthMiddleware = AuthMiddleware;
// 新增：检查用户是否为管理员的中间件
const isAdmin = (req, res, next) => {
    var _a;
    // 确保此中间件在 AuthMiddleware 之后运行
    // 将比较改为不区分大小写
    if (((_a = req.userRole) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'admin') {
        console.log(`[isAdmin] 权限检查通过: 用户ID ${req.userId} 是管理员`);
        next(); // 用户是管理员，继续处理请求
    }
    else {
        console.log(`[isAdmin] 权限检查失败: 用户ID ${req.userId}, 角色 ${req.userRole} 不是管理员`);
        res.status(403).json({ message: 'Forbidden: Admin access required' }); // 用户不是管理员，返回 403 Forbidden
    }
};
exports.isAdmin = isAdmin;
//# sourceMappingURL=AuthMiddleware.js.map