"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const foodShowcaseController_1 = require("../controllers/foodShowcaseController");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
// 定义获取所有 FoodShowcase 的路由 (Public)
router.get('/', foodShowcaseController_1.getAllFoodShowcases);
// 定义创建 FoodShowcase 的路由 (Protected, requires login)
// 1. Verify Token
// 2. Handle single image upload (field name 'image')
// 3. Call the controller function
router.post('/', AuthMiddleware_1.AuthMiddleware, 
// Apply Multer middleware and handle potential errors
(req, res, next) => {
    (0, uploadMiddleware_1.uploadFoodShowcaseImage)(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
            console.error('[Multer Error - POST /]:', err.code, err.message);
            return res.status(400).json({ message: `图片上传错误: ${err.message}` });
        }
        else if (err) {
            console.error('[Upload Middleware Error - POST /]:', err.message);
            return res.status(400).json({ message: err.message || '图片上传处理失败' });
        }
        next();
    });
}, foodShowcaseController_1.createShowcase);
// --- Add PUT route for updating ---
router.put('/:id', AuthMiddleware_1.AuthMiddleware, 
// Apply Multer middleware and handle potential errors
(req, res, next) => {
    (0, uploadMiddleware_1.uploadFoodShowcaseImage)(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
            // Multer specific errors (e.g., file size limit)
            console.error('[Multer Error - PUT /:id]:', err.code, err.message);
            return res.status(400).json({ message: `图片上传错误: ${err.message}` });
        }
        else if (err) {
            // Other errors (e.g., from file filter)
            console.error('[Upload Middleware Error - PUT /:id]:', err.message);
            return res.status(400).json({ message: err.message || '图片上传处理失败' });
        }
        // If no error, proceed to the next middleware/controller
        next();
    });
}, foodShowcaseController_1.updateShowcaseById);
// --- Add DELETE route ---
router.delete('/:id', AuthMiddleware_1.AuthMiddleware, // Ensure user is authenticated
foodShowcaseController_1.deleteShowcaseById // Use the new controller function
);
// --- Change DELETE /bulk to POST /bulk-delete ---
router.post(// Change from router.delete
'/bulk-delete', // Change path
AuthMiddleware_1.AuthMiddleware, // Ensure user is authenticated
foodShowcaseController_1.deleteShowcasesBulk // Controller remains the same
);
// --- Stats Route (Public or Protected, decide based on needs) ---
// Placing it before /:id routes to avoid conflict
router.get('/stats', foodShowcaseController_1.getShowcaseStats);
exports.default = router;
//# sourceMappingURL=foodShowcaseRoutes.js.map