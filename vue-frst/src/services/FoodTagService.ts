import http from '@/http';
import type { Tag } from '@/types/models';

export type TagListResponse = Tag[];

export const FoodTagService = {
    /**
     * 获取所有美食标签
     * @returns 所有美食标签列表
     */
    async getAllTags(): Promise<TagListResponse> {
        console.log('[FoodTagService] Fetching all food tags...');
        try {
            const response = await http.get<TagListResponse>('/food-tags');
            console.log('[FoodTagService] Tags fetched successfully:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[FoodTagService] Error fetching tags:', error);
            throw new Error('获取美食标签列表失败');
        }
    },

    /**
     * 创建新的美食标签
     * @param name 标签名称
     * @returns 新创建的标签对象
     */
    async createTag(name: string): Promise<Tag> {
        console.log(`[FoodTagService] Creating tag: ${name}`);
        try {
            const response = await http.post<Tag>('/food-tags', { name });
            console.log('[FoodTagService] Tag created successfully:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[FoodTagService] Error creating tag:', error);
            throw new Error(error.response?.data?.message || '创建美食标签失败');
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
            const response = await http.put<Tag>(`/food-tags/${id}`, { name });
            return response.data;
        } catch (error: any) {
            console.error(`[FoodTagService] Error updating tag ${id}:`, error);
            throw new Error(error.response?.data?.message || `更新美食标签 ${id} 失败`);
        }
    },

    /**
     * 删除美食标签
     * @param id 标签ID
     * @returns 删除是否成功
     */
    async deleteTag(id: number): Promise<void> {
        try {
            await http.delete(`/food-tags/${id}`);
        } catch (error: any) {
            console.error(`[FoodTagService] Error deleting tag ${id}:`, error);
            throw new Error(error.response?.data?.message || `删除美食标签 ${id} 失败`);
        }
    }
};
