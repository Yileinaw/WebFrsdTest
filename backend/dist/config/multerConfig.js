"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
// 确保上传目录存在
const ensureExists = (dirPath) => {
    // Check relative to project root (backend/)
    const absolutePath = path_1.default.resolve(process.cwd(), dirPath);
    if (!fs_1.default.existsSync(absolutePath)) {
        fs_1.default.mkdirSync(absolutePath, { recursive: true });
        // Keep this log for directory creation confirmation
        console.log(`Created directory: ${absolutePath}`);
    }
    else {
        // console.log(`Directory already exists: ${absolutePath}`);
    }
};
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        var _a;
        // Determine the upload directory based on the route
        let uploadDir = 'storage/uploads/posts'; // Default for posts
        if (req.baseUrl.includes('/users') && ((_a = req.route) === null || _a === void 0 ? void 0 : _a.path) === '/me/avatar') {
            // Corrected path for avatar uploads
            uploadDir = 'storage/uploads/avatars';
        }
        else if (req.baseUrl.includes('/posts')) {
            // Explicitly keep posts going to their directory (or adjust if needed)
            uploadDir = 'storage/uploads/posts';
        }
        // console.log(`[Multer Config] Request BaseURL: ${req.baseUrl}, Route Path: ${req.route?.path}, Determined Upload Dir: ${uploadDir}`)
        ensureExists(uploadDir); // Ensure the target directory exists
        cb(null, uploadDir); // Pass the determined directory to Multer
    },
    filename: (req, file, cb) => {
        // Keep the unique filename generation logic
        const uniqueSuffix = Date.now() + '-' + crypto_1.default.randomBytes(8).toString('hex');
        const extension = path_1.default.extname(file.originalname);
        // Use a consistent filename structure, fieldname can be helpful
        const finalFilename = file.fieldname + '-' + uniqueSuffix + extension;
        // console.log(`[Multer Config] Original: ${file.originalname}, Generated: ${finalFilename}`);
        cb(null, finalFilename);
    }
});
const fileFilter = (req, file, cb) => {
    console.log('[Multer Config] File filter called for file:', file.originalname, 'Mimetype:', file.mimetype);
    // 只接受图片文件
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        // 使用 Error 对象来传递错误消息，符合 Multer 的预期
        cb(new Error('文件类型错误，仅支持上传图片！'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制文件大小为 5MB
    }
});
exports.default = upload;
//# sourceMappingURL=multerConfig.js.map