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
const FoodTagService_1 = require("../services/FoodTagService");
const getAllTags = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tags = yield FoodTagService_1.FoodTagService.getAllTags();
        res.json(tags);
    }
    catch (error) {
        console.error('[FoodTagController] Error fetching tags:', error);
        res.status(500).json({ message: '获取美食标签时发生内部错误' });
    }
});
exports.getAllTags = getAllTags;
const updateTag = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: '标签名称不能为空' });
    }
    try {
        const updatedTag = yield FoodTagService_1.FoodTagService.updateTag(Number(id), name);
        if (!updatedTag) {
            return res.status(404).json({ message: '美食标签未找到或为固定标签，无法更新' });
        }
        res.json(updatedTag);
    }
    catch (error) {
        console.error(`[FoodTagController] Error updating tag ${id}:`, error);
        res.status(500).json({ message: '更新美食标签时发生内部错误' });
    }
});
exports.updateTag = updateTag;
const createTag = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: '标签名称不能为空' });
    }
    try {
        const newTag = yield FoodTagService_1.FoodTagService.createTag(name);
        res.status(201).json(newTag);
    }
    catch (error) {
        console.error(`[FoodTagController] Error creating tag with name ${name}:`, error);
        if (error instanceof Error && error.message.includes('已存在')) {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: '创建美食标签时发生内部错误' });
    }
});
exports.createTag = createTag;
const deleteTag = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const success = yield FoodTagService_1.FoodTagService.deleteTag(Number(id));
        if (!success) {
            return res.status(404).json({ message: '美食标签未找到或为固定标签，无法删除' });
        }
        res.json({ message: '美食标签删除成功' });
    }
    catch (error) {
        console.error(`[FoodTagController] Error deleting tag ${id}:`, error);
        res.status(500).json({ message: '删除美食标签时发生内部错误' });
    }
});
exports.deleteTag = deleteTag;
//# sourceMappingURL=FoodTagController.js.map