import { Request, Response } from 'express';
import { PostTagService } from '../services/PostTagService';

export const getAllTags = async (req: Request, res: Response) => {
    try {
        const tags = await PostTagService.getAllTags();
        res.json(tags);
    } catch (error) {
        console.error('[PostTagController] Error fetching tags:', error);
        res.status(500).json({ message: '获取帖子标签时发生内部错误' });
    }
};

export const updateTag = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: '标签名称不能为空' });
    }

    try {
        const updatedTag = await PostTagService.updateTag(Number(id), name);
        if (!updatedTag) {
            return res.status(404).json({ message: '帖子标签未找到或为固定标签，无法更新' });
        }
        res.json(updatedTag);
    } catch (error) {
        console.error(`[PostTagController] Error updating tag ${id}:`, error);
        res.status(500).json({ message: '更新帖子标签时发生内部错误' });
    }
};

export const createTag = async (req: Request, res: Response) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: '标签名称不能为空' });
    }

    try {
        const newTag = await PostTagService.createTag(name);
        res.status(201).json(newTag);
    } catch (error) {
        console.error(`[PostTagController] Error creating tag with name ${name}:`, error);
        if (error instanceof Error && error.message.includes('已存在')) {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: '创建帖子标签时发生内部错误' });
    }
};

export const deleteTag = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const success = await PostTagService.deleteTag(Number(id));
        if (!success) {
            return res.status(404).json({ message: '帖子标签未找到或为固定标签，无法删除' });
        }
        res.json({ message: '帖子标签删除成功' });
    } catch (error) {
        console.error(`[PostTagController] Error deleting tag ${id}:`, error);
        res.status(500).json({ message: '删除帖子标签时发生内部错误' });
    }
};
