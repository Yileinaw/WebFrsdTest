"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShowcaseStats = exports.deleteShowcasesBulk = exports.deleteShowcaseById = exports.updateShowcaseById = exports.createShowcase = exports.getAllFoodShowcases = void 0;
// import prisma from '../db'; // No longer needed directly here
const FoodShowcaseService_1 = require("../services/FoodShowcaseService"); // Import the service
// 获取所有 FoodShowcase 记录 (支持筛选和分页)
const getAllFoodShowcases = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extract search, tags, page, and limit query parameters
        const search = req.query.search;
        // Expect tags as a pipe-separated string (e.g., "tag1|tag2|tag3")
        const tagsQuery = req.query.tags;
        const tagNames = tagsQuery ? tagsQuery.split('|').map(tag => tag.trim()).filter(Boolean) : undefined;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const includeTags = req.query.includeTags === 'true';
        // console.log(`[FoodShowcaseController] Received request with search: '${search}', tags: ${tagNames?.join(',')}, page: ${page}, limit: ${limit}, includeTags: ${includeTags}`); // Log parsed tags
        // Pass the parsed tagNames array to the service
        const { items, totalCount } = yield FoodShowcaseService_1.FoodShowcaseService.getAllShowcases({
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
    }
    catch (error) {
        console.error('[FoodShowcaseController] Error fetching food showcases:', error);
        // Distinguish between expected errors (like invalid input) and server errors if needed
        if (error instanceof Error && error.message.includes('Failed to retrieve')) {
            res.status(500).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: '获取美食展示数据时发生内部错误' });
        }
    }
});
exports.getAllFoodShowcases = getAllFoodShowcases;
// 新增: 处理创建 FoodShowcase 的请求 (包括图片上传)
const createShowcase = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if file was uploaded by Multer
        if (!req.file) {
            return res.status(400).json({ message: '请求失败：需要上传图片文件。' });
        }
        // Construct the image URL based on where Multer saved the file
        // This needs to match how files are served statically
        const imageUrl = `/uploads/food-showcase/${req.file.filename}`;
        // Extract other data from the request body
        const { title, description, tags } = req.body;
        // Validate or parse tags (assuming tags are sent as a comma-separated string or JSON array)
        let tagNames = [];
        if (typeof tags === 'string') {
            tagNames = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        }
        else if (Array.isArray(tags)) {
            tagNames = tags.filter(tag => typeof tag === 'string');
        }
        // console.log(`[FoodShowcaseController] Received create request with title: ${title}, desc: ${description}, tags: ${tagNames.join(',')}, image: ${imageUrl}`); // Commented out
        // Call the service to create the showcase
        const newShowcase = yield FoodShowcaseService_1.FoodShowcaseService.createShowcase({
            imageUrl,
            title,
            description,
            tagNames: tagNames.length > 0 ? tagNames : undefined
        });
        res.status(201).json({ message: 'Food showcase created successfully', showcase: newShowcase });
    }
    catch (error) {
        console.error('[FoodShowcaseController] Error creating food showcase:', error);
        // Provide specific error messages based on the service error
        if (error.message && error.message.includes('标签不存在')) {
            res.status(400).json({ message: error.message });
        }
        else if (error.message && error.message.includes('Failed to create')) {
            res.status(500).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: '创建美食展示时发生内部错误' });
        }
    }
});
exports.createShowcase = createShowcase;
// --- Add updateShowcaseById controller ---
const updateShowcaseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const showcaseId = parseInt(id, 10);
    if (isNaN(showcaseId)) {
        return res.status(400).json({ message: '无效的 Showcase ID' });
    }
    try {
        // Extract data from body (title, description, tags)
        const { title, description, tags } = req.body;
        let imageUrl = undefined;
        // Check if a new file was uploaded for update
        if (req.file) {
            imageUrl = `/uploads/food-showcase/${req.file.filename}`;
            // console.log(`[FoodShowcaseController] New image received for update ${showcaseId}: ${imageUrl}`); // Commented out
        }
        // Parse tags
        let tagNames = [];
        if (typeof tags === 'string') {
            tagNames = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        }
        else if (Array.isArray(tags)) {
            tagNames = tags.filter(tag => typeof tag === 'string');
        }
        // console.log(`[FoodShowcaseController] Updating ${showcaseId} with title: ${title}, desc: ${description}, tags: ${tagNames.join(',')}, image: ${imageUrl ?? ' (no change)'}`); // Commented out
        const updatedShowcase = yield FoodShowcaseService_1.FoodShowcaseService.updateShowcase(showcaseId, {
            title,
            description,
            imageUrl, // Pass the new image URL if it exists
            tagNames // Pass the parsed tag names
        });
        if (!updatedShowcase) {
            return res.status(404).json({ message: `Showcase with ID ${showcaseId} not found.` });
        }
        res.json({ message: 'Food showcase updated successfully', showcase: updatedShowcase });
    }
    catch (error) {
        console.error(`[FoodShowcaseController] Error updating food showcase ${showcaseId}:`, error);
        // Ensure JSON response
        if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('not found')) || ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('标签不存在'))) {
            return res.status(404).json({ message: error.message || '资源未找到或关联标签不存在' });
        }
        else {
            return res.status(500).json({ message: error.message || '更新美食展示时发生内部错误' });
        }
    }
});
exports.updateShowcaseById = updateShowcaseById;
// --- Add deleteShowcaseById controller ---
const deleteShowcaseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const showcaseId = parseInt(id, 10);
    if (isNaN(showcaseId)) {
        return res.status(400).json({ message: '无效的 Showcase ID' });
    }
    try {
        // console.log(`[FoodShowcaseController] Deleting showcase ${showcaseId}`); // Commented out
        yield FoodShowcaseService_1.FoodShowcaseService.deleteShowcase(showcaseId);
        res.status(200).json({ message: 'Food showcase deleted successfully' }); // Use 200 OK or 204 No Content
    }
    catch (error) {
        console.error(`[FoodShowcaseController] Error deleting food showcase ${showcaseId}:`, error);
        // Ensure JSON response
        if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('not found')) {
            return res.status(404).json({ message: error.message || '资源未找到' });
        }
        else {
            return res.status(500).json({ message: error.message || '删除美食展示时发生内部错误' });
        }
    }
});
exports.deleteShowcaseById = deleteShowcaseById;
// --- Add deleteShowcasesBulk controller ---
const deleteShowcasesBulk = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const result = yield FoodShowcaseService_1.FoodShowcaseService.deleteShowcasesBulk(numericIds);
        res.status(200).json({ message: `成功批量删除 ${result.count} 项。`, count: result.count });
    }
    catch (error) {
        console.error(`[FoodShowcaseController] Error bulk deleting food showcases:`, error);
        res.status(500).json({ message: error.message || '批量删除时发生内部错误' });
    }
});
exports.deleteShowcasesBulk = deleteShowcasesBulk;
// --- Add Controller for Stats ---
const getShowcaseStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield FoodShowcaseService_1.FoodShowcaseService.getShowcaseStats();
        res.json(stats);
    }
    catch (error) {
        console.error('[FoodShowcaseController] Error fetching showcase stats:', error);
        res.status(500).json({ message: error.message || '获取统计数据时发生内部错误' });
    }
});
exports.getShowcaseStats = getShowcaseStats;
//# sourceMappingURL=foodShowcaseController.js.map