import http from '@/http';
import type { Tag } from '@/types/models';

export type TagListResponse = Tag[];

export const FoodTagService = {
    /**
     * 获取所有美食标签
     * @returns 所有美食标签列表
     */
    async getAllTags(): Promise<TagListResponse> {
        try {
            const response = await http.get<TagListResponse>('/api/food-tags');
            return response.data;
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('[FoodTagService] Error fetching tags:', error);
            }
            throw new Error('获取美食标签列表失败');
        }
    },

    /**
     * 创建新的美食标签
     * @param name 标签名称
     * @returns 新创建的标签对象
     */
    async createTag(name: string): Promise<Tag> {
        try {
            const response = await http.post<Tag>('/api/food-tags', { name });
            return response.data;
        } catch (error) {
            console.error(`[FoodTagService] Error creating tag with name ${name}:`, error);
            throw error;
        }
    },

    /**
     * 更新美食标签
     * @param id 标签ID
     * @param name 新标签名称
     * @returns 更新后的标签对象
     */
    async updateTag(id: number, name: string): Promise<Tag> {
        try {
            const response = await http.put<Tag>(`/api/food-tags/${id}`, { name });
            return response.data;
        } catch (error) {
            console.error(`[FoodTagService] Error updating tag ${id}:`, error);
            throw error;
        }
    },

    /**
     * 删除美食标签
     * @param id 标签ID
     * @returns 删除是否成功
     */
    async deleteTag(id: number): Promise<boolean> {
        try {
            await http.delete(`/api/food-tags/${id}`);
            return true;
        } catch (error) {
            console.error(`[FoodTagService] Error deleting tag ${id}:`, error);
            return false;
        }
    }
};
