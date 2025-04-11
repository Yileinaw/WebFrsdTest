import { Request, Response } from 'express';
import { TagService } from '../services/TagService';

export const getAllTags = async (req: Request, res: Response) => {
    try {
        const tags = await TagService.getAllTags();
        res.json(tags);
    } catch (error) {
        console.error('[TagController] Error fetching tags:', error);
        res.status(500).json({ message: '获取标签时发生内部错误' });
    }
};

// Controller method to update a tag
export const updateTag = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body; // Get the new name from the request body

    if (!name) {
        return res.status(400).json({ message: '标签名称不能为空' });
    }

    try {
        const updatedTag = await TagService.updateTag(Number(id), name);
        if (!updatedTag) {
            return res.status(404).json({ message: '标签未找到或为固定标签，无法更新' });
        }
        res.json(updatedTag);
    } catch (error) {
        console.error(`[TagController] Error updating tag ${id}:`, error);
        res.status(500).json({ message: '更新标签时发生内部错误' });
    }
};

// Controller method to create a new tag
export const createTag = async (req: Request, res: Response) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: '标签名称不能为空' });
    }

    try {
        const newTag = await TagService.createTag(name);
        res.status(201).json(newTag); // Send 201 Created status and the new tag
    } catch (error) {
        console.error(`[TagController] Error creating tag with name ${name}:`, error);
        // Handle specific errors like duplicates
        if (error instanceof Error && error.message.includes('已存在')) {
            return res.status(409).json({ message: error.message }); // 409 Conflict
        }
        res.status(500).json({ message: '创建标签时发生内部错误' });
    }
};

// Controller method to delete a tag
export const deleteTag = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const success = await TagService.deleteTag(Number(id));
        if (!success) {
            return res.status(404).json({ message: '标签未找到或为固定标签，无法删除' });
        }
        res.status(200).json({ message: `标签 ${id} 删除成功` }); // Send 200 OK on success
    } catch (error) {
        console.error(`[TagController] Error deleting tag ${id}:`, error);
        res.status(500).json({ message: '删除标签时发生内部错误' });
    }
}; 