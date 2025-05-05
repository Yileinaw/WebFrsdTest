// src/routes/SettingsRoutes.ts
import { Router } from 'express';
import SettingsController from '../controllers/SettingsController';
// Import the exported middleware functions by their names
import { AdminMiddleware } from '../middleware/AdminMiddleware'; 
import { AuthMiddleware } from '../middleware/AuthMiddleware'; // Import AuthMiddleware
// Import the logo upload middleware
import { uploadLogoImage } from '../middleware/uploadMiddleware';

const router = Router();

// Apply Authentication middleware first, then Admin middleware to all settings routes
// Correct order: AuthMiddleware ensures req.userId is set before AdminMiddleware runs.
router.use(AuthMiddleware); // Apply AuthMiddleware first
router.use(AdminMiddleware); // Then apply AdminMiddleware

// Define routes
router.get('/', SettingsController.getSettings.bind(SettingsController));
router.put('/', SettingsController.updateSettings.bind(SettingsController));
// Apply logo upload middleware ONLY to this specific route
// Note: AuthMiddleware and AdminMiddleware already apply due to router.use() above
router.post('/upload-logo', uploadLogoImage, SettingsController.uploadLogo.bind(SettingsController));

export default router;
