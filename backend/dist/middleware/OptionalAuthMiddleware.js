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
exports.OptionalAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../db"));
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SUPER_SECRET_KEY';
const OptionalAuthMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[OptionalAuthMiddleware] 处理请求: ${req.method} ${req.originalUrl}`);
    const authHeader = req.headers.authorization;
    // 只在有认证头且格式正确时处理
    if (authHeader && authHeader.startsWith('Bearer ')) {
        console.log('[OptionalAuthMiddleware] 检测到认证头');
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            console.log(`[OptionalAuthMiddleware] Token解码成功，用户ID: ${decoded.userId}`);
            // 同时验证用户在数据库中是否存在
            const user = yield db_1.default.user.findUnique({ where: { id: decoded.userId } });
            if (user) {
                console.log(`[OptionalAuthMiddleware] 用户验证成功: ${user.username || user.email}`);
                req.userId = decoded.userId; // 如果token有效且用户存在，附加userId
            }
            else {
                console.log(`[OptionalAuthMiddleware] 数据库中未找到用户ID ${decoded.userId}，作为游客处理`);
            }
        }
        catch (error) {
            // 无效token? 忽略，作为游客处理。不发送401。
            console.warn('[OptionalAuthMiddleware] 无效token，作为游客处理:', error.message);
        }
    }
    else {
        console.log('[OptionalAuthMiddleware] 未提供认证头，作为游客处理');
    }
    // 无论是否认证，总是调用next()
    console.log(`[OptionalAuthMiddleware] 调用next()，用户ID: ${req.userId || '游客'}`);
    next();
});
exports.OptionalAuthMiddleware = OptionalAuthMiddleware;
//# sourceMappingURL=OptionalAuthMiddleware.js.map