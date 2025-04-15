"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const multer_1 = __importDefault(require("multer"));
// 增强的错误处理中间件
const errorHandler = (err, req, res, next) => {
    // 详细记录错误信息
    console.error('[ErrorHandler] 发生错误:', {
        url: req.originalUrl,
        method: req.method,
        errorMessage: err.message,
        errorName: err.name,
        errorCode: err.code,
        errorStack: err.stack
    });
    // 检查是否为 Multer 错误（例如，文件大小限制）
    if (err instanceof multer_1.default.MulterError) {
        return res.status(400).json({ message: `上传错误: ${err.message}` });
    }
    // 检查自定义错误消息（例如，文件类型过滤器）
    else if (err.message && err.message.includes('文件类型错误')) {
        return res.status(400).json({ message: err.message });
    }
    // 检查是否为数据库连接错误
    else if (err.code === 'P1001' || err.code === 'P1002' || err.message.includes('database') || err.message.includes('prisma')) {
        console.error('[ErrorHandler] 数据库连接错误:', err);
        return res.status(503).json({ message: '数据库连接错误，请稍后再试' });
    }
    // 检查是否为 Supabase 错误
    else if (err.message && (err.message.includes('supabase') || err.message.includes('storage'))) {
        console.error('[ErrorHandler] Supabase 存储错误:', err);
        return res.status(500).json({ message: '文件存储服务错误，请稍后再试' });
    }
    // 处理其他错误
    else {
        // 避免在生产环境中向客户端发送详细的内部错误
        const statusCode = res.statusCode !== 200 ? res.statusCode : 500; // 如果已设置状态码，则使用现有状态码，否则为 500
        const message = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message || '服务器发生未知错误';
        res.status(statusCode).json({
            message: message,
            // 可选地在开发环境中包含堆栈跟踪
            stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
        });
    }
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=ErrorHandlingMiddleware.js.map