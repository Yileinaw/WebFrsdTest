"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
// Restore original server.ts structure
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors = __importStar(require("cors"));
const path_1 = __importDefault(require("path"));
const AuthRoutes_1 = __importDefault(require("./routes/AuthRoutes"));
const UserRoutes_1 = require("./routes/UserRoutes");
const PostRoutes_1 = require("./routes/PostRoutes");
const FeedRoutes_1 = __importDefault(require("./routes/FeedRoutes"));
const NotificationRoutes_1 = __importDefault(require("./routes/NotificationRoutes"));
const foodShowcaseRoutes_1 = __importDefault(require("./routes/foodShowcaseRoutes"));
const PostTagRoutes_1 = __importDefault(require("./routes/PostTagRoutes"));
const FoodTagRoutes_1 = __importDefault(require("./routes/FoodTagRoutes"));
const AdminRoutes_1 = __importDefault(require("./routes/AdminRoutes")); // Import admin routes
const ErrorHandlingMiddleware_1 = require("./middleware/ErrorHandlingMiddleware");
const mailer_1 = require("./utils/mailer"); // <-- 导入邮件初始化函数
// import morgan from 'morgan'; // Removed morgan import
// --- Remove direct imports, rely on userRoutes ---
// import { UserController } from './controllers/UserController';
// import { AuthMiddleware } from './middleware/AuthMiddleware';
// --- End Remove ---
// Remove server startup log, keep only the final listening log
// console.log("--- RUNNING FULL SERVER.TS ---");
// --- Remove Log Database URL ---
// console.log('[server.ts] DATABASE_URL used by this process:', process.env.DATABASE_URL);
// --- End Remove Log Database URL ---
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// --- Middlewares ---
// app.use((req, res, next) => {
//   console.log(`[Request Logger]: ${req.method} ${req.originalUrl}`);
//   next();
// });
// Explicitly configure CORS
const allowedOrigins = [
    'http://localhost:5173',
    'https://web-frsd-test.vercel.app',
    'https://web-frsd-test-git-master-yileinaws-projects.vercel.app',
    'http://120.227.223.28:3001',
    'http://120.227.223.28',
    'https://f9ea-120-227-223-28.ngrok-free.app'
]; // 添加 Vercel 域名、公网IP 和 ngrok URL
// 使用更宽松的 CORS 配置
const corsOptions = {
    origin: '*', // 允许所有来源
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // 如果需要处理 cookie 或授权标头
};
app.use(cors.default(corsOptions));
// --- Ensure Body Parsers are Active ---
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// --- End Ensure ---
// --- Remove EARLY Mount / Restore Original Order ---
// app.use('/api/posts', postRouter); // Remove potential early mount
// --- Static Files for Public Assets ---
const publicDirectory = path_1.default.resolve(__dirname, '..', 'public');
// Serve files directly from the root (e.g., /avatars/defaults/1.jpg maps to public/avatars/defaults/1.jpg)
app.use(express_1.default.static(publicDirectory));
console.log(`[Server] Serving static files from: ${publicDirectory}`);
// --- Static Files for User Uploads (Keep as is or adjust if needed) ---
// Assuming uploads are separate and served under /uploads
const uploadsRootDirectory = path_1.default.resolve(__dirname, '..', 'storage', 'uploads');
app.use('/uploads', express_1.default.static(uploadsRootDirectory));
console.log(`[Server] Serving user uploads from: ${uploadsRootDirectory} at /uploads`);
// --- 静态文件服务中间件 (Keep for user uploads) ---
// const uploadsDirectory = path.join(process.cwd(), 'uploads'); // Old version removed
// console.log(`[Server] Serving user uploads from: ${uploadsDirectory} at /uploads`);
// app.use('/uploads', express.static(uploadsDirectory)); // Old version removed
// --- End Restore Static Files ---
// --- Base Route ---
app.get('/', (req, res) => {
    res.send('TDFRS Backend API is running!');
});
// --- 直接挂载路由到根路径，而不是重定向 ---
// 将 /api/auth 路由同时挂载到 /auth 路径
app.use('/auth', AuthRoutes_1.default);
app.use('/posts', PostRoutes_1.postRouter);
app.use('/comments', PostRoutes_1.commentRouter);
app.use('/feed', FeedRoutes_1.default);
app.use('/notifications', NotificationRoutes_1.default);
app.use('/food-showcase', foodShowcaseRoutes_1.default);
app.use('/post-tags', PostTagRoutes_1.default);
app.use('/food-tags', FoodTagRoutes_1.default);
app.use('/admin', AdminRoutes_1.default);
app.use('/users', UserRoutes_1.userRouter);
// --- Restore Original API Route Order ---
// 添加调试日志
console.log('[server.ts] 挂载认证路由到 /api/auth');
app.use('/api/auth', (req, res, next) => {
    console.log(`[server.ts] 收到请求: ${req.method} ${req.originalUrl}`);
    next();
}, AuthRoutes_1.default);
app.use('/api/users', (req, res, next) => {
    // console.log(`[server.ts] Request to /api/users path: ${req.originalUrl}`);
    next();
}, UserRoutes_1.userRouter);
// --- Restore original /api/posts mount position ---
app.use('/api/posts', PostRoutes_1.postRouter);
app.use('/api/comments', PostRoutes_1.commentRouter);
app.use('/api/feed', FeedRoutes_1.default);
app.use('/api/notifications', NotificationRoutes_1.default);
app.use('/api/food-showcase', foodShowcaseRoutes_1.default);
app.use('/api/post-tags', PostTagRoutes_1.default); // 挂载帖子标签路由
app.use('/api/food-tags', FoodTagRoutes_1.default); // 挂载美食标签路由
app.use('/api/admin', AdminRoutes_1.default); // Mount admin routes
// --- 添加详细的错误日志中间件 ---
app.use((err, req, res, next) => {
    console.error('[ErrorLoggerMiddleware] 详细错误日志:', {
        url: req.originalUrl,
        method: req.method,
        errorMessage: err.message,
        errorStack: err.stack,
        errorName: err.name,
        errorCode: err.code
    });
    next(err);
});
// --- 404 处理中间件 ---
app.use('/api/*', (req, res) => {
    console.log(`[Server] API 路径不存在: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: 'API 路径不存在', path: req.originalUrl });
});
// --- 全局错误处理中间件 ---
app.use(ErrorHandlingMiddleware_1.errorHandler);
// --- 添加前端路由回退处理 ---
// 这个中间件必须放在所有API路由之后，用于处理前端路由刷新问题
// 添加通用的前端路由处理，不依赖于前端构建目录
// 所有未匹配的路由都返回 200 状态码，允许前端路由处理
app.use('*', (req, res, next) => {
    const url = req.originalUrl || req.url;
    // 打印所有请求以便于调试
    console.log(`[Server] 收到请求: ${req.method} ${url}`);
    // 如果是 API 请求或静态资源请求，则交给下一个中间件处理
    if (req.method !== 'GET' ||
        url.startsWith('/api/') ||
        url.startsWith('/auth/') ||
        url.startsWith('/posts/') ||
        url.startsWith('/comments/') ||
        url.startsWith('/feed/') ||
        url.startsWith('/notifications/') ||
        url.startsWith('/food-showcase/') ||
        url.startsWith('/post-tags/') ||
        url.startsWith('/food-tags/') ||
        url.startsWith('/admin/') ||
        url.startsWith('/users/') ||
        url.startsWith('/uploads/') ||
        url.includes('.')) {
        return next();
    }
    // 如果是前端路由请求，则返回 200 状态码
    console.log(`[Server] 处理前端路由请求: ${req.path}`);
    // 尝试从前端构建目录返回 index.html
    const frontendDistPath = path_1.default.resolve(__dirname, '..', 'public', 'frontend');
    const fs = require('fs');
    const indexPath = path_1.default.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    // 如果前端构建目录不存在，则返回简单的 HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>API Server</title>
    </head>
    <body>
      <h1>API Server is running</h1>
      <p>This is a backend API server. Frontend routes are being handled.</p>
    </body>
    </html>
  `);
});
// --- End API Routes ---
// 异步启动函数
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, mailer_1.initializeMailer)(); // <-- 初始化邮件服务
            // 确保 port 是数字类型
            const portNumber = typeof port === 'string' ? parseInt(port, 10) : port;
            app.listen(portNumber, '0.0.0.0', () => {
                // Keep this log
                console.log(`[Server]: Server is running at http://0.0.0.0:${portNumber} (accessible from all network interfaces)`);
            });
        }
        catch (error) {
            console.error('Failed to start the server:', error);
            process.exit(1); // 如果邮件服务初始化失败，则退出进程
        }
    });
}
// 调用启动函数
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map