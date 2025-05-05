"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPostImage = exports.uploadAvatarImage = exports.uploadFoodShowcaseImage = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// Log the current working directory
// console.log('[UploadMiddleware] process.cwd():', process.cwd()); // Comment out log
// Define storage settings for FoodShowcase images using memory storage
const memoryStorage = multer_1.default.memoryStorage(); // Use memory storage
// Define file filter to accept only common image types
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb(new Error('文件类型错误：只允许上传图片文件 (JPEG, PNG, GIF, WEBP)'));
    }
};
// Create Multer instance specifically for single food showcase image uploads
// Expecting the file input field name to be 'image' in the form data
exports.uploadFoodShowcaseImage = (0, multer_1.default)({
    storage: memoryStorage, // Use memory storage instead of foodShowcaseStorage
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB limit
    }
}).single('image'); // Handle single file upload with field name 'image'
// Create Multer instance specifically for single user avatar image uploads
exports.uploadAvatarImage = (0, multer_1.default)({
    storage: memoryStorage, // Reuse memory storage
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 1024 * 1024 * 2 // Limit avatar size to 2MB (adjust as needed)
    }
}).single('avatar'); // Expecting the file input field name to be 'avatar'
// Create Multer instance specifically for single post image uploads
exports.uploadPostImage = (0, multer_1.default)({
    storage: memoryStorage, // Reuse memory storage
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 1024 * 1024 * 10 // Limit post image size to 10MB (adjust as needed)
    }
}).single('image'); // Expecting the file input field name to be 'image'
// ... potentially other exports or logic ... 
//# sourceMappingURL=uploadMiddleware.js.map