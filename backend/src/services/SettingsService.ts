// src/services/SettingsService.ts
import { PrismaClient, Setting } from '@prisma/client';
import { Express } from 'express';

const prisma = new PrismaClient();

class SettingsService {
  /**
   * Retrieves all settings from the database.
   * @returns {Promise<Record<string, string>>} A promise that resolves to an object where keys are setting keys and values are setting values.
   */
  async getSettings(): Promise<Record<string, string>> {
    const settingsList: Setting[] = await prisma.setting.findMany();

    // Transform the array of settings into a key-value object
    const settingsMap = settingsList.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    return settingsMap;
  }

  /**
   * Updates or creates multiple settings in the database.
   * @param {Record<string, string>} settingsData - An object containing the settings to update (key: setting key, value: new setting value).
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async updateSettings(settingsData: Record<string, string>): Promise<void> {
    const updateOperations = Object.entries(settingsData).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key: key },
        update: { value: value },
        create: { key: key, value: value },
      });
    });

    // Execute all upsert operations within a transaction
    await prisma.$transaction(updateOperations);
  }

  /**
   * Uploads a new website logo.
   * @param {Express.Multer.File} file - The uploaded file object from multer.
   * @returns {Promise<string>} A promise that resolves to the public URL of the uploaded logo.
   * @throws {Error} If the file upload fails or the URL cannot be retrieved.
   */
  async uploadLogo(file: Express.Multer.File): Promise<string> {
    // Assume supabase client is initialized and imported
    // You might need to adjust this import based on your project structure
    const { supabase } = require('../lib/supabaseClient'); // Placeholder import
    const bucketName = 'system-assets'; // Or your preferred bucket
    const fileExt = file.originalname.split('.').pop();
    const filePath = `logo.${fileExt}`; // Consistent filename

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, { 
        cacheControl: '3600', // Cache for 1 hour
        upsert: true, // Overwrite if exists
        contentType: file.mimetype // Set correct content type
      });

    if (uploadError) {
      console.error('[SettingsService] Supabase upload error:', uploadError);
      throw new Error('Failed to upload logo to storage.');
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
        console.error('[SettingsService] Failed to get public URL for:', filePath);
        // Optionally, attempt to remove the uploaded file if URL retrieval fails
        await supabase.storage.from(bucketName).remove([filePath]);
        throw new Error('Failed to retrieve logo URL after upload.');
    }

    const logoUrl = urlData.publicUrl;

    // Update the logoUrl setting in the database
    await prisma.setting.upsert({
      where: { key: 'logoUrl' },
      update: { value: logoUrl },
      create: { key: 'logoUrl', value: logoUrl },
    });

    console.log(`[SettingsService] Logo uploaded successfully: ${logoUrl}`);
    return logoUrl;
  }
}

export default new SettingsService();
