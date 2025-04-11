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
        // Remove log
        // console.log('[Multer Config] Destination function called for file:', file.originalname);
        let uploadDir = 'public/images/post'; // 默认帖子图片
        if (req.baseUrl.includes('users') && req.route.path.includes('avatar')) {
            uploadDir = 'public/images/avatars';
        }
        ensureExists(uploadDir);
        cb(null, uploadDir); // Multer 会基于项目根目录解析此路径
    },
    filename: (req, file, cb) => {
        // Remove log
        console.log('[Multer Config] Filename function called for file:', file.originalname);
        // 生成唯一文件名: 时间戳-随机字符串.原扩展名
        const uniqueSuffix = Date.now() + '-' + crypto_1.default.randomBytes(8).toString('hex');
        const extension = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
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