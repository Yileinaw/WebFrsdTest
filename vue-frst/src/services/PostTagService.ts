import http from '@/http';
import type { Tag } from '@/types/models';

export type TagListResponse = Tag[];

export const PostTagService = {
    /**
     * 获取所有帖子标签
     * @returns 所有帖子标签列表
     */
    async getAllTags(): Promise<TagListResponse> {
        console.log('[PostTagService] Fetching all post tags...');
        try {
            const response = await http.get<TagListResponse>('/post-tags');
            console.log('[PostTagService] Tags fetched successfully:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[PostTagService] Error fetching tags:', error);
            throw new Error('获取帖子标签列表失败');
        }
    },

    /**
     * 创建新的帖子标签
     * @param name 标签名称
     * @returns 新创建的标签对象
     */
    async createTag(name: string): Promise<Tag> {
        console.log(`[PostTagService] Creating tag: ${name}`);
        try {
            const response = await http.post<Tag>('/post-tags', { name });
            console.log('[PostTagService] Tag created successfully:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[PostTagService] Error creating tag:', error);
            throw new Error(error.response?.data?.message || '创建帖子标签失败');
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
            const response = await http.put<Tag>(`/post-tags/${id}`, { name });
            return response.data;
        } catch (error: any) {
            console.error(`[PostTagService] Error updating tag ${id}:`, error);
            throw new Error(error.response?.data?.message || `更新帖子标签 ${id} 失败`);
        }
    },

    /**
     * 删除帖子标签
     * @param id 标签ID
     * @returns 删除是否成功
     */
    async deleteTag(id: number): Promise<void> {
        try {
            await http.delete(`/post-tags/${id}`);
        } catch (error: any) {
            console.error(`[PostTagService] Error deleting tag ${id}:`, error);
            throw new Error(error.response?.data?.message || `删除帖子标签 ${id} 失败`);
        }
    }
};
