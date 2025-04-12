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
const TagRoutes_1 = __importDefault(require("./routes/TagRoutes")); // Import tag routes
const ErrorHandlingMiddleware_1 = require("./middleware/ErrorHandlingMiddleware");
const mailer_1 = require("./utils/mailer"); // <-- 导入邮件初始化函数
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
const allowedOrigins = ['http://localhost:5173']; // Add other origins if needed
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // If you need to handle cookies or authorization headers
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
// --- Restore Original API Route Order ---
app.use('/api/auth', AuthRoutes_1.default);
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
app.use('/api/tags', TagRoutes_1.default); // Mount tag routes
// --- 全局错误处理中间件 ---
app.use(ErrorHandlingMiddleware_1.errorHandler);
// --- End API Routes ---
// 异步启动函数
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, mailer_1.initializeMailer)(); // <-- 初始化邮件服务
            app.listen(port, () => {
                // Keep this log
                console.log(`[Server]: Server is running at http://localhost:${port}`);
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