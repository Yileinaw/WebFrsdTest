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
import tagRouter from './routes/TagRoutes'; // Import tag routes
import { errorHandler } from './middleware/ErrorHandlingMiddleware';
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
const allowedOrigins = ['http://localhost:5173']; // Add other origins if needed

const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
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
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
// --- End Ensure ---

// --- Remove EARLY Mount / Restore Original Order ---
// app.use('/api/posts', postRouter); // Remove potential early mount

// --- Static Files for Public Assets ---
// Calculate public dir based on project root (assuming cwd is project root)
// const publicDirectory = path.resolve(process.cwd(), 'backend', 'public'); // Old incorrect path
const publicDirectory = path.resolve(__dirname, '..', 'public'); // Correct path relative to src
app.use('/static', express.static(publicDirectory)); 
// console.log(`[Server] Serving general static files from: ${publicDirectory} at /static`);

// --- Static Files for User Uploads - Based on project root (cwd) ---
// const uploadsRootDirectory = path.resolve(process.cwd(), 'backend', 'storage', 'uploads'); // Old incorrect path
const uploadsRootDirectory = path.resolve(__dirname, '..', 'storage', 'uploads'); // Correct path relative to src

app.use('/uploads', express.static(uploadsRootDirectory));
// Log the final absolute path being served
// console.log(`[Server] Serving user uploads from: ${uploadsRootDirectory} at /uploads`);

// --- 静态文件服务中间件 (Keep for user uploads) ---
// const uploadsDirectory = path.join(process.cwd(), 'uploads'); // Old version removed
// console.log(`[Server] Serving user uploads from: ${uploadsDirectory} at /uploads`);
// app.use('/uploads', express.static(uploadsDirectory)); // Old version removed
// --- End Restore Static Files ---

// --- Base Route --- 
app.get('/', (req: Request, res: Response) => {
    res.send('TDFRS Backend API is running!');
});

// --- Restore Original API Route Order ---
app.use('/api/auth', authRoutes);
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
app.use('/api/tags', tagRouter); // Mount tag routes

// --- 全局错误处理中间件 ---
app.use(errorHandler as ErrorRequestHandler);

// --- End API Routes ---

app.listen(port, () => {
     // Keep this log
    console.log(`[Server]: Server is running at http://localhost:${port}`); 
});

export default app; 