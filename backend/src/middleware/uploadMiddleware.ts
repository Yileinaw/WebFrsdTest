import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Log the current working directory
// console.log('[UploadMiddleware] process.cwd():', process.cwd()); // Comment out log

// Define the upload directory path relative to the project root (process.cwd())
// const foodShowcaseUploadDir = path.resolve(process.cwd(), 'backend', 'storage', 'uploads', 'food-showcase'); // Old incorrect path
const foodShowcaseUploadDir = path.resolve(__dirname, '..', '..', 'storage', 'uploads', 'food-showcase'); // Correct path relative to middleware dir

// console.log(`[UploadMiddleware] Target upload dir (calculated): ${foodShowcaseUploadDir}`); // Log for verification
try {
    // Ensure the full path exists, including intermediate directories
    fs.mkdirSync(foodShowcaseUploadDir, { recursive: true });
    // console.log(`[UploadMiddleware] Ensured directory exists or created: ${foodShowcaseUploadDir}`); // Comment out log
} catch (error) {
    // Keep this error log, it's important if directory creation fails
    console.error(`[UploadMiddleware] Failed to create directory ${foodShowcaseUploadDir}:`, error); 
}

// Define storage settings for FoodShowcase images using memory storage
const memoryStorage = multer.memoryStorage(); // Use memory storage

// Define file filter to accept only common image types
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('文件类型错误：只允许上传图片文件 (JPEG, PNG, GIF, WEBP)'));
  }
};

// Create Multer instance specifically for single food showcase image uploads
// Expecting the file input field name to be 'image' in the form data
export const uploadFoodShowcaseImage = multer({
  storage: memoryStorage, // Use memory storage instead of foodShowcaseStorage
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB limit
  }
}).single('image'); // Handle single file upload with field name 'image'

// Create Multer instance specifically for single user avatar image uploads
export const uploadAvatarImage = multer({
  storage: memoryStorage, // Reuse memory storage
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 2 // Limit avatar size to 2MB (adjust as needed)
  }
}).single('avatar'); // Expecting the file input field name to be 'avatar'

// Create Multer instance specifically for single post image uploads
export const uploadPostImage = multer({
  storage: memoryStorage, // Reuse memory storage
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 10 // Limit post image size to 10MB (adjust as needed)
  }
}).single('image'); // Expecting the file input field name to be 'image'

// ... potentially other exports or logic ... 