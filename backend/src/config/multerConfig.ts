import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// 确保上传目录存在
const ensureExists = (dirPath: string) => {
  // Check relative to project root (backend/)
  const absolutePath = path.resolve(process.cwd(), dirPath);
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { recursive: true });
    // Keep this log for directory creation confirmation
    console.log(`Created directory: ${absolutePath}`); 
  } else {
    // console.log(`Directory already exists: ${absolutePath}`);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine the upload directory based on the route
    let uploadDir = 'storage/uploads/posts'; // Default for posts
    if (req.baseUrl.includes('/users') && req.route?.path === '/me/avatar') {
        // Corrected path for avatar uploads
        uploadDir = 'storage/uploads/avatars'; 
    } else if (req.baseUrl.includes('/posts')) {
        // Explicitly keep posts going to their directory (or adjust if needed)
        uploadDir = 'storage/uploads/posts';
    }

    // console.log(`[Multer Config] Request BaseURL: ${req.baseUrl}, Route Path: ${req.route?.path}, Determined Upload Dir: ${uploadDir}`)
    
    ensureExists(uploadDir); // Ensure the target directory exists
    cb(null, uploadDir); // Pass the determined directory to Multer
  },
  filename: (req, file, cb) => {
    // Keep the unique filename generation logic
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname);
    // Use a consistent filename structure, fieldname can be helpful
    const finalFilename = file.fieldname + '-' + uniqueSuffix + extension;
    // console.log(`[Multer Config] Original: ${file.originalname}, Generated: ${finalFilename}`);
    cb(null, finalFilename);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('[Multer Config] File filter called for file:', file.originalname, 'Mimetype:', file.mimetype);
  // 只接受图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    // 使用 Error 对象来传递错误消息，符合 Multer 的预期
    cb(new Error('文件类型错误，仅支持上传图片！')); 
  }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制文件大小为 5MB
    }
});

export default upload; 