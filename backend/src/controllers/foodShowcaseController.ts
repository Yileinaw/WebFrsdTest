import { Request, Response } from 'express';
// import prisma from '../db'; // No longer needed directly here
import { FoodShowcaseService } from '../services/FoodShowcaseService'; // Import the service
import { AuthenticatedRequest } from '../middleware/AuthMiddleware'; // Assuming admin actions require auth
import { supabase } from '../lib/supabaseClient'; // Import the Supabase client
import path from 'path'; // Import path module for extension extraction

// 获取所有 FoodShowcase 记录 (支持筛选和分页)
export const getAllFoodShowcases = async (req: Request, res: Response) => {
  try {
    // Extract search, tags, page, and limit query parameters
    const search = req.query.search as string | undefined;
    // Expect tags as a pipe-separated string (e.g., "tag1|tag2|tag3")
    const tagsQuery = req.query.tags as string | undefined; 
    const tagNames = tagsQuery ? tagsQuery.split('|').map(tag => tag.trim()).filter(Boolean) : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const includeTags = req.query.includeTags === 'true';

    // console.log(`[FoodShowcaseController] Received request with search: '${search}', tags: ${tagNames?.join(',')}, page: ${page}, limit: ${limit}, includeTags: ${includeTags}`); // Log parsed tags

    // Pass the parsed tagNames array to the service
    const { items, totalCount } = await FoodShowcaseService.getAllShowcases({
      search, 
      tagNames, // Use the parsed array
      page, 
      limit,
      includeTags // Pass includeTags option
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Return paginated response structure expected by frontend
    res.json({ 
      items,
      totalCount,
      page,
      totalPages
    });
  } catch (error) {
    console.error('[FoodShowcaseController] Error fetching food showcases:', error);
    // Distinguish between expected errors (like invalid input) and server errors if needed
    if (error instanceof Error && error.message.includes('Failed to retrieve')) {
         res.status(500).json({ message: error.message });
    } else {
        res.status(500).json({ message: '获取美食展示数据时发生内部错误' });
    }
  }
};

// 新增: 处理创建 FoodShowcase 的请求 (包括图片上传到 Supabase)
export const createShowcase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if file was uploaded by Multer (now in memory)
    if (!req.file) {
      return res.status(400).json({ message: '请求失败：需要上传图片文件。' });
    }

    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname;
    const fileExt = path.extname(originalName);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `food-showcase-${uniqueSuffix}${fileExt}`;
    const filePath = `food-showcase/${fileName}`; // Path within the bucket

    const bucketName = process.env.SUPABASE_BUCKET_NAME;
    if (!bucketName) {
        console.error('[FoodShowcaseController] Supabase bucket name not configured in .env');
        return res.status(500).json({ message: '服务器配置错误：存储桶名称未设置。' });
    }

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: req.file.mimetype, // Use mimetype from Multer
        cacheControl: '3600', // Cache for 1 hour
        upsert: false // Don't overwrite existing file with same name (should be unique anyway)
      });

    if (uploadError) {
      console.error('[FoodShowcaseController] Supabase upload error:', uploadError);
      return res.status(500).json({ message: '上传图片到云存储失败。', error: uploadError.message });
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
        // Handle cases where public URL might not be immediately available or accessible
        // Potentially try to construct it manually if necessary, but usually getPublicUrl should work
        console.error('[FoodShowcaseController] Failed to get public URL from Supabase for path:', filePath);
        // Clean up uploaded file if URL retrieval fails? Maybe not necessary if bucket is public.
        return res.status(500).json({ message: '获取图片公共链接失败。' });
    }

    const imageUrl = urlData.publicUrl; // Use the public URL from Supabase

    // Extract other data from the request body
    const { title, description, tags } = req.body;

    // Validate or parse tags (assuming tags are sent as a comma-separated string or JSON array)
    let tagNames: string[] = [];
    if (typeof tags === 'string') {
        tagNames = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    } else if (Array.isArray(tags)) {
        tagNames = tags.filter(tag => typeof tag === 'string');
    }
    // console.log(`[FoodShowcaseController] Received create request with title: ${title}, desc: ${description}, tags: ${tagNames.join(',')}, image URL: ${imageUrl}`);

    // Call the service to create the showcase
    const newShowcase = await FoodShowcaseService.createShowcase({
      imageUrl, // Pass the Supabase public URL
      title,
      description,
      tagNames: tagNames.length > 0 ? tagNames : undefined
    });

    res.status(201).json({ message: 'Food showcase created successfully', showcase: newShowcase });

  } catch (error: any) {
    console.error('[FoodShowcaseController] Error creating food showcase:', error);
    // Provide specific error messages based on the service error
    if (error.message && error.message.includes('标签不存在')) {
         res.status(400).json({ message: error.message });
    } else if (error.message && error.message.includes('Failed to create')) {
        res.status(500).json({ message: error.message });
    } else {
        res.status(500).json({ message: '创建美食展示时发生内部错误' });
    }
  }
};

// --- Update updateShowcaseById controller to use Supabase ---
export const updateShowcaseById = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const showcaseId = parseInt(id, 10);

    if (isNaN(showcaseId)) {
        return res.status(400).json({ message: '无效的 Showcase ID' });
    }

    try {
        // Extract data from body (title, description, tags)
        const { title, description, tags } = req.body;
        let imageUrl: string | undefined = undefined; // Initialize imageUrl as undefined

        const bucketName = process.env.SUPABASE_BUCKET_NAME;
        if (!bucketName) {
            console.error('[FoodShowcaseController] Supabase bucket name not configured in .env');
            return res.status(500).json({ message: '服务器配置错误：存储桶名称未设置。' });
        }

        // Check if a new file was uploaded for update
        if (req.file) {
            // console.log(`[FoodShowcaseController] New image received for update ${showcaseId}`);
            const fileBuffer = req.file.buffer;
            const originalName = req.file.originalname;
            const fileExt = path.extname(originalName);
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileName = `food-showcase-${uniqueSuffix}${fileExt}`;
            const filePath = `food-showcase/${fileName}`; // Path within the bucket

            // Upload new file to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, fileBuffer, {
                    contentType: req.file.mimetype,
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error(`[FoodShowcaseController] Supabase upload error during update for ${showcaseId}:`, uploadError);
                return res.status(500).json({ message: '更新图片时上传到云存储失败。', error: uploadError.message });
            }

            // Get public URL for the newly uploaded file
            const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

             if (!urlData || !urlData.publicUrl) {
                console.error(`[FoodShowcaseController] Failed to get public URL from Supabase for updated image:`, filePath);
                return res.status(500).json({ message: '更新图片后获取公共链接失败。' });
            }

            imageUrl = urlData.publicUrl; // Set imageUrl to the new public URL

            // Optional: Delete the old image from Supabase here if needed
            // This would require fetching the old showcase record first to get the old image URL
            // For now, we are just uploading the new one.
        }

        // Parse tags
        let tagNames: string[] = [];
        if (typeof tags === 'string') {
            tagNames = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        } else if (Array.isArray(tags)) {
            tagNames = tags.filter(tag => typeof tag === 'string');
        }
         // console.log(`[FoodShowcaseController] Updating ${showcaseId} with title: ${title}, desc: ${description}, tags: ${tagNames.join(',')}, image URL: ${imageUrl ?? ' (no change)'}`);

        const updatedShowcase = await FoodShowcaseService.updateShowcase(showcaseId, {
            title,
            description,
            imageUrl, // Pass the new Supabase URL if a new image was uploaded, otherwise undefined
            tagNames // Pass the parsed tag names
        });

        if (!updatedShowcase) {
            return res.status(404).json({ message: `Showcase with ID ${showcaseId} not found.` });
        }

        res.json({ message: 'Food showcase updated successfully', showcase: updatedShowcase });

    } catch (error: any) {
        console.error(`[FoodShowcaseController] Error updating food showcase ${showcaseId}:`, error);
        // Ensure JSON response
        if (error.message?.includes('not found') || error.message?.includes('标签不存在')) {
             return res.status(404).json({ message: error.message || '资源未找到或关联标签不存在' });
        } else {
            return res.status(500).json({ message: error.message || '更新美食展示时发生内部错误' });
        }
    }
};

// --- Add deleteShowcaseById controller ---
export const deleteShowcaseById = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const showcaseId = parseInt(id, 10);

    if (isNaN(showcaseId)) {
        return res.status(400).json({ message: '无效的 Showcase ID' });
    }

    try {
         // console.log(`[FoodShowcaseController] Deleting showcase ${showcaseId}`); // Commented out
        await FoodShowcaseService.deleteShowcase(showcaseId);
        res.status(200).json({ message: 'Food showcase deleted successfully' }); // Use 200 OK or 204 No Content
    } catch (error: any) {
        console.error(`[FoodShowcaseController] Error deleting food showcase ${showcaseId}:`, error);
        // Ensure JSON response
        if (error.message?.includes('not found')) {
            return res.status(404).json({ message: error.message || '资源未找到' });
        } else {
            return res.status(500).json({ message: error.message || '删除美食展示时发生内部错误' });
        }
    }
};

// --- Add deleteShowcasesBulk controller ---
export const deleteShowcasesBulk = async (req: AuthenticatedRequest, res: Response) => {
    // console.log('[FoodShowcaseController - Bulk Delete] Received request body:', req.body); // Comment out log
    const { ids } = req.body; // Expect an array of IDs in the request body
    // console.log('[FoodShowcaseController - Bulk Delete] Extracted ids:', ids); // Comment out log

    if (!Array.isArray(ids) || ids.length === 0) {
        // console.error('[FoodShowcaseController - Bulk Delete] Validation failed: ids is not a valid array or is empty.'); // Comment out log
        return res.status(400).json({ message: '请求体中需要包含有效的 ID 数组。' });
    }

    // Optional: Validate that all IDs are numbers
    const numericIds = ids.map(id => Number(id)).filter(id => !isNaN(id));
    // console.log('[FoodShowcaseController - Bulk Delete] Numeric ids after validation:', numericIds); // Comment out log
    if (numericIds.length !== ids.length) {
         // console.error('[FoodShowcaseController - Bulk Delete] Validation failed: non-numeric values found in ids array.'); // Comment out log
         return res.status(400).json({ message: 'ID 数组中包含无效值。' });
    }

    try {
        // Keep this log for confirmation
        // console.log(`[FoodShowcaseController] Bulk deleting showcases with IDs: [${numericIds.join(', ')}]`); // Comment out this one too for now
        const result = await FoodShowcaseService.deleteShowcasesBulk(numericIds);
        res.status(200).json({ message: `成功批量删除 ${result.count} 项。`, count: result.count });
    } catch (error: any) {
        console.error(`[FoodShowcaseController] Error bulk deleting food showcases:`, error);
        res.status(500).json({ message: error.message || '批量删除时发生内部错误' });
    }
};

// --- Add Controller for Stats ---
export const getShowcaseStats = async (req: Request, res: Response) => {
  try {
    const stats = await FoodShowcaseService.getShowcaseStats();
    res.json(stats);
  } catch (error: any) {
    console.error('[FoodShowcaseController] Error fetching showcase stats:', error);
    res.status(500).json({ message: error.message || '获取统计数据时发生内部错误' });
  }
}; 