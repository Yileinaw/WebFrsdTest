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
exports.deleteTag = exports.createTag = exports.updateTag = exports.getAllTags = void 0;
const TagService_1 = require("../services/TagService");
const getAllTags = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tags = yield TagService_1.TagService.getAllTags();
        res.json(tags);
    }
    catch (error) {
        console.error('[TagController] Error fetching tags:', error);
        res.status(500).json({ message: '获取标签时发生内部错误' });
    }
});
exports.getAllTags = getAllTags;
// Controller method to update a tag
const updateTag = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name } = req.body; // Get the new name from the request body
    if (!name) {
        return res.status(400).json({ message: '标签名称不能为空' });
    }
    try {
        const updatedTag = yield TagService_1.TagService.updateTag(Number(id), name);
        if (!updatedTag) {
            return res.status(404).json({ message: '标签未找到或为固定标签，无法更新' });
        }
        res.json(updatedTag);
    }
    catch (error) {
        console.error(`[TagController] Error updating tag ${id}:`, error);
        res.status(500).json({ message: '更新标签时发生内部错误' });
    }
});
exports.updateTag = updateTag;
// Controller method to create a new tag
const createTag = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: '标签名称不能为空' });
    }
    try {
        const newTag = yield TagService_1.TagService.createTag(name);
        res.status(201).json(newTag); // Send 201 Created status and the new tag
    }
    catch (error) {
        console.error(`[TagController] Error creating tag with name ${name}:`, error);
        // Handle specific errors like duplicates
        if (error instanceof Error && error.message.includes('已存在')) {
            return res.status(409).json({ message: error.message }); // 409 Conflict
        }
        res.status(500).json({ message: '创建标签时发生内部错误' });
    }
});
exports.createTag = createTag;
// Controller method to delete a tag
const deleteTag = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const success = yield TagService_1.TagService.deleteTag(Number(id));
        if (!success) {
            return res.status(404).json({ message: '标签未找到或为固定标签，无法删除' });
        }
        res.status(200).json({ message: `标签 ${id} 删除成功` }); // Send 200 OK on success
    }
    catch (error) {
        console.error(`[TagController] Error deleting tag ${id}:`, error);
        res.status(500).json({ message: '删除标签时发生内部错误' });
    }
});
exports.deleteTag = deleteTag;
//# sourceMappingURL=TagController.js.map