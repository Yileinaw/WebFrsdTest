import http from '@/http';
import type { Tag } from '@/types/models';

export type TagListResponse = Tag[];

export const PostTagService = {
    /**
     * 获取所有帖子标签
     * @returns 所有帖子标签列表
     */
    async getAllTags(): Promise<TagListResponse> {
        try {
            const response = await http.get<TagListResponse>('/api/post-tags');
            return response.data;
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('[PostTagService] Error fetching tags:', error);
            }
            throw new Error('获取帖子标签列表失败');
        }
    },

    /**
     * 创建新的帖子标签
     * @param name 标签名称
     * @returns 新创建的标签对象
     */
    async createTag(name: string): Promise<Tag> {
        try {
            const response = await http.post<Tag>('/api/post-tags', { name });
            return response.data;
        } catch (error) {
            console.error(`[PostTagService] Error creating tag with name ${name}:`, error);
            throw error;
        }
    },

    /**
     * 更新帖子标签
     * @param id 标签ID
     * @param name 新标签名称
     * @returns 更新后的标签对象
     */
    async updateTag(id: number, name: string): Promise<Tag> {
        try {
            const response = await http.put<Tag>(`/api/post-tags/${id}`, { name });
            return response.data;
        } catch (error) {
            console.error(`[PostTagService] Error updating tag ${id}:`, error);
            throw error;
        }
    },

    /**
     * 删除帖子标签
     * @param id 标签ID
     * @returns 删除是否成功
     */
    async deleteTag(id: number): Promise<boolean> {
        try {
            await http.delete(`/api/post-tags/${id}`);
            return true;
        } catch (error) {
            console.error(`[PostTagService] Error deleting tag ${id}:`, error);
            return false;
        }
    }
};
