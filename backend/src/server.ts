// Restore original server.ts structure
import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import dotenv from 'dotenv';
import * as cors from 'cors';
import path from 'path';
import authRoutes from './routes/AuthRoutes';
import { userRouter } from './routes/UserRoutes';
import { postRouter, commentRouter } from './routes/PostRoutes';
import feedRouter from './routes/FeedRoutes';
import notificationRouter from './routes/NotificationRoutes';
import foodShowcaseRouter from './routes/foodShowcaseRoutes';
import postTagRouter from './routes/PostTagRoutes';
import foodTagRouter from './routes/FoodTagRoutes';
import adminRouter from './routes/AdminRoutes'; // Import admin routes
import { errorHandler } from './middleware/ErrorHandlingMiddleware';
import { initializeMailer } from './utils/mailer'; // <-- 导入邮件初始化函数
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

dotenv.config();

const app: Express = express();
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
const corsOptions: cors.CorsOptions = {
  origin: '*', // 允许所有来源
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // 如果需要处理 cookie 或授权标头
};
app.use(cors.default(corsOptions));

// --- Ensure Body Parsers are Active ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// --- End Ensure ---

// --- Remove EARLY Mount / Restore Original Order ---
// app.use('/api/posts', postRouter); // Remove potential early mount

// --- Static Files for Public Assets ---
const publicDirectory = path.resolve(__dirname, '..', 'public');
// Serve files directly from the root (e.g., /avatars/defaults/1.jpg maps to public/avatars/defaults/1.jpg)
app.use(express.static(publicDirectory));
console.log(`[Server] Serving static files from: ${publicDirectory}`);

// --- Static Files for User Uploads (Keep as is or adjust if needed) ---
// Assuming uploads are separate and served under /uploads
const uploadsRootDirectory = path.resolve(__dirname, '..', 'storage', 'uploads');
app.use('/uploads', express.static(uploadsRootDirectory));
console.log(`[Server] Serving user uploads from: ${uploadsRootDirectory} at /uploads`);

// --- 静态文件服务中间件 (Keep for user uploads) ---
// const uploadsDirectory = path.join(process.cwd(), 'uploads'); // Old version removed
// console.log(`[Server] Serving user uploads from: ${uploadsDirectory} at /uploads`);
// app.use('/uploads', express.static(uploadsDirectory)); // Old version removed
// --- End Restore Static Files ---

// --- Base Route ---
app.get('/', (req: Request, res: Response) => {
    res.send('TDFRS Backend API is running!');
});

// --- 同时挂载路由到根路径和 /api 路径 ---
// 注意：前端代码中使用的是 /auth 路径，所以需要同时挂载
// 挂载认证路由到根路径
app.use('/auth', authRoutes);
app.use('/posts', postRouter);
app.use('/comments', commentRouter);
app.use('/feed', feedRouter);
app.use('/notifications', notificationRouter);
app.use('/food-showcase', foodShowcaseRouter);
app.use('/post-tags', postTagRouter);
app.use('/food-tags', foodTagRouter);
app.use('/admin', adminRouter);
app.use('/users', userRouter);

// --- Restore Original API Route Order ---
// 添加调试日志
console.log('[server.ts] 挂载认证路由到 /api/auth');
app.use('/api/auth', (req, res, next) => {
    console.log(`[server.ts] 收到请求: ${req.method} ${req.originalUrl}`);
    next();
}, authRoutes);
app.use('/api/users', (req, res, next) => {
    // console.log(`[server.ts] Request to /api/users path: ${req.originalUrl}`);
    next();
}, userRouter);

// --- Restore original /api/posts mount position ---
app.use('/api/posts', postRouter);

app.use('/api/comments', commentRouter);
app.use('/api/feed', feedRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/food-showcase', foodShowcaseRouter);
app.use('/api/post-tags', postTagRouter); // 挂载帖子标签路由
app.use('/api/food-tags', foodTagRouter); // 挂载美食标签路由
app.use('/api/admin', adminRouter); // Mount admin routes

// --- 添加错误日志中间件 ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // 在非生产环境下输出详细错误信息
    if (process.env.NODE_ENV !== 'production') {
        console.error('[ErrorLoggerMiddleware] 详细错误日志:', {
            url: req.originalUrl,
            method: req.method,
            errorMessage: err.message,
            errorStack: err.stack,
            errorName: err.name,
            errorCode: err.code
        });
    } else {
        // 在生产环境下只输出基本错误信息，不包含堆栈跟踪
        console.error('[ErrorLoggerMiddleware] 错误:', {
            url: req.originalUrl,
            method: req.method,
            errorMessage: err.message,
            errorName: err.name,
            errorCode: err.code
        });
    }
    next(err);
});

// --- 404 处理中间件 ---
app.use('/api/*', (req: Request, res: Response) => {
  console.log(`[Server] API 路径不存在: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'API 路径不存在', path: req.originalUrl });
});

// --- 全局错误处理中间件 ---
app.use(errorHandler as ErrorRequestHandler);

// --- 添加前端路由回退处理 ---
// 这个中间件必须放在所有API路由之后，用于处理前端路由刷新问题

// 添加通用的前端路由处理，不依赖于前端构建目录
// 所有未匹配的路由都返回 200 状态码，允许前端路由处理
app.use('*', (req: Request, res: Response, next: NextFunction) => {
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
  const frontendDistPath = path.resolve(__dirname, '..', 'public', 'frontend');
  const fs = require('fs');
  const indexPath = path.join(frontendDistPath, 'index.html');

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
async function startServer() {
  try {
    await initializeMailer(); // <-- 初始化邮件服务
// 确保 port 是数字类型
const portNumber = typeof port === 'string' ? parseInt(port, 10) : port;
app.listen(portNumber, '0.0.0.0', () => {
     // Keep this log
    console.log(`[Server]: Server is running at http://0.0.0.0:${portNumber} (accessible from all network interfaces)`);
});
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1); // 如果邮件服务初始化失败，则退出进程
  }
}

// 调用启动函数
startServer();

export default app;