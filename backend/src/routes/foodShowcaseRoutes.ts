import { Router } from 'express';
import { getAllFoodShowcases, createShowcase, updateShowcaseById, deleteShowcaseById, deleteShowcasesBulk, getShowcaseStats } from '../controllers/foodShowcaseController';
import { uploadFoodShowcaseImage } from '../middleware/uploadMiddleware';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import multer from 'multer';

const router = Router();

// 定义获取所有 FoodShowcase 的路由 (Public)
router.get('/', getAllFoodShowcases);

// 定义创建 FoodShowcase 的路由 (Protected, requires login)
// 1. Verify Token
// 2. Handle single image upload (field name 'image')
// 3. Call the controller function
router.post(
    '/', 
    AuthMiddleware,
    // Apply Multer middleware and handle potential errors
    (req, res, next) => {
        uploadFoodShowcaseImage(req, res, (err: any) => {
            if (err instanceof multer.MulterError) {
                console.error('[Multer Error - POST /]:', err.code, err.message);
                return res.status(400).json({ message: `图片上传错误: ${err.message}` });
            } else if (err) {
                console.error('[Upload Middleware Error - POST /]:', err.message);
                return res.status(400).json({ message: err.message || '图片上传处理失败' });
            }
            next();
        });
    },
    createShowcase
);

// --- Add PUT route for updating ---
router.put(
    '/:id', 
    AuthMiddleware, 
    // Apply Multer middleware and handle potential errors
    (req, res, next) => {
        uploadFoodShowcaseImage(req, res, (err: any) => {
            if (err instanceof multer.MulterError) {
                // Multer specific errors (e.g., file size limit)
                console.error('[Multer Error - PUT /:id]:', err.code, err.message);
                return res.status(400).json({ message: `图片上传错误: ${err.message}` });
            } else if (err) {
                // Other errors (e.g., from file filter)
                console.error('[Upload Middleware Error - PUT /:id]:', err.message);
                return res.status(400).json({ message: err.message || '图片上传处理失败' });
            }
            // If no error, proceed to the next middleware/controller
            next();
        });
    },
    updateShowcaseById 
);

// --- Add DELETE route ---
router.delete(
    '/:id', 
    AuthMiddleware, // Ensure user is authenticated
    deleteShowcaseById // Use the new controller function
);

// --- Change DELETE /bulk to POST /bulk-delete ---
router.post( // Change from router.delete
    '/bulk-delete', // Change path
    AuthMiddleware, // Ensure user is authenticated
    deleteShowcasesBulk // Controller remains the same
);

// --- Stats Route (Public or Protected, decide based on needs) ---
// Placing it before /:id routes to avoid conflict
router.get('/stats', getShowcaseStats);

export default router; 