// src/controllers/SettingsController.ts
import { Request, Response, NextFunction } from 'express';
import SettingsService from '../services/SettingsService';

class SettingsController {
  // Implement controller methods here
  // e.g., handleGetSettings, handleUpdateSettings, handleUploadLogo

  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      // Call SettingsService to get settings
      const settings = await SettingsService.getSettings();
      res.status(200).json(settings);
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      // Get settings data from the request body
      const settingsData: Record<string, string> = req.body;

      // Validate input (optional but recommended)
      if (typeof settingsData !== 'object' || settingsData === null) {
        return res.status(400).json({ message: 'Invalid request body: Expected an object.' });
      }
      // Add more specific validation if needed (e.g., check for allowed keys)

      // Call SettingsService to update settings
      await SettingsService.updateSettings(settingsData);
      
      // Send success response (e.g., 204 No Content or 200 OK)
      res.status(200).json({ message: 'Settings updated successfully.' });
    } catch (error) {
      next(error);
    }
  }

  async uploadLogo(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if a file was uploaded by multer middleware
      if (!req.file) {
        return res.status(400).json({ message: 'No logo file uploaded.' });
      }

      // Call SettingsService to handle the upload and update database
      const logoUrl = await SettingsService.uploadLogo(req.file);

      // Send success response with the new logo URL
      res.status(200).json({ 
        message: 'Logo uploaded successfully.',
        logoUrl: logoUrl 
      });
    } catch (error) {
      // Handle specific errors (e.g., upload failed)
      if (error instanceof Error) {
        console.error('[SettingsController] Logo upload error:', error.message);
        // Return a more specific error message if needed
      }
      next(error); // Pass to the general error handler
    }
  }
}

export default new SettingsController();
