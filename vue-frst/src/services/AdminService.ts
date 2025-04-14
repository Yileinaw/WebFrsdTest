import http from '../http';
// Assuming FoodShowcasePreview and Tag are correctly defined and exported from models.ts
import type { FoodShowcasePreview, Tag } from '../types/models';
import { ElMessage } from 'element-plus';

interface AdminShowcaseListResponse extends Array<FoodShowcasePreview> {}
// Define Paginated Response Type
interface PaginatedFoodShowcaseResponse {
  items: FoodShowcasePreview[];
  totalCount: number;
  page: number;
  totalPages: number;
}

interface ShowcaseMutationResponse {
    message: string;
    showcase: FoodShowcasePreview;
}

interface TagListResponse extends Array<Tag> {}

// Define Stats Response Type
interface ShowcaseStatsResponse {
  totalCount: number;
  tagsCount: Array<{ name: string; count: number }>;
}

// 定义仪表盘统计数据接口
interface DashboardStatsResponse {
    showcases: {
        total: number;
        growth: number;
    };
    users: {
        total: number;
        growth: number;
    };
    posts: {
        total: number;
        growth: number;
    };
    favorites: {
        total: number;
        growth: number;
    };
    contentTrend: Array<{
        date: string;
        showcases: number;
        posts: number;
    }>;
    tagDistribution: Array<{
        name: string;
        count: number;
    }>;
    recentContent: Array<{
        id: number;
        title: string;
        type: string; // 'post' 或 'showcase'
        createdAt: string;
    }>;
}

// Export the service object
export const AdminService = {

    // --- Food Showcase Management --- //
    async getFoodShowcases(params: {
        page?: number;
        limit?: number;
        includeTags?: boolean;
        search?: string;
        tags?: string[];
    } = {}): Promise<PaginatedFoodShowcaseResponse> {
        const { page = 1, limit = 10, includeTags = true, search, tags } = params;
        const queryParams = new URLSearchParams();
        queryParams.append('page', String(page));
        queryParams.append('limit', String(limit));
        if (includeTags) {
            queryParams.append('includeTags', 'true');
        }
        if (search) {
            queryParams.append('search', search);
        }
        if (tags && tags.length > 0) {
            queryParams.append('tags', tags.join('|'));
        }

        const response = await http.get<PaginatedFoodShowcaseResponse>(`/food-showcase?${queryParams.toString()}`);
        return response.data;
    },

    async createFoodShowcase(formData: FormData): Promise<ShowcaseMutationResponse> {
        try {
            console.log('[AdminService] 发送美食图片上传请求');
            const response = await http.post<ShowcaseMutationResponse>('/food-showcase', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('[AdminService] 美食图片上传成功:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[AdminService] 美食图片上传失败:', error.response || error);
            // 如果是认证错误，添加更明确的错误信息
            if (error.response?.status === 401) {
                throw new Error('认证失败，请重新登录后再试');
            }
            throw error;
        }
    },

    async updateFoodShowcase(id: number, formData: FormData): Promise<ShowcaseMutationResponse> {
        try {
            console.log(`[AdminService] 发送美食图片更新请求 ID: ${id}`);
            const response = await http.put<ShowcaseMutationResponse>(`/food-showcase/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('[AdminService] 美食图片更新成功:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`[AdminService] 美食图片更新失败 ID: ${id}:`, error.response || error);
            // 如果是认证错误，添加更明确的错误信息
            if (error.response?.status === 401) {
                throw new Error('认证失败，请重新登录后再试');
            }
            throw error;
        }
    },

    async deleteFoodShowcase(id: number): Promise<{ message: string }> {
        try {
            console.log(`[AdminService] 发送美食图片删除请求 ID: ${id}`);
            const response = await http.delete<{ message: string }>(`/food-showcase/${id}`);
            console.log('[AdminService] 美食图片删除成功:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`[AdminService] 美食图片删除失败 ID: ${id}:`, error.response || error);
            // 如果是认证错误，添加更明确的错误信息
            if (error.response?.status === 401) {
                throw new Error('认证失败，请重新登录后再试');
            }
            throw error;
        }
    },

    // --- Add Bulk Delete method (now using POST) ---
    async deleteFoodShowcasesBulk(ids: number[]): Promise<{ message: string; count?: number }> {
        try {
            console.log(`[AdminService] 发送美食图片批量删除请求 IDs: ${ids.join(', ')}`);
            const response = await http.post<{ message: string; count?: number }>('/food-showcase/bulk-delete', {
                ids // 在请求体中发送ID数组
            });
            console.log('[AdminService] 美食图片批量删除成功:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[AdminService] 美食图片批量删除失败:', error.response || error);
            // 如果是认证错误，添加更明确的错误信息
            if (error.response?.status === 401) {
                throw new Error('认证失败，请重新登录后再试');
            }
            throw error;
        }
    },

    // --- Tag Management --- //
    async getAllTags(): Promise<TagListResponse> {
        try {
            console.log('[AdminService] 获取标签列表');
            const response = await http.get<TagListResponse>('/tags');
            console.log('[AdminService] 标签列表获取成功:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[AdminService] 标签列表获取失败:', error.response || error);
            // 如果是认证错误，不显示错误提示，因为这可能是公开接口
            if (error.response?.status !== 401) {
                ElMessage.error('获取标签列表失败');
            }
            return []; // 错误时返回空数组
        }
    },

    // --- Add updateTag method ---
    async updateTag(tagId: number, data: { name: string }): Promise<Tag> {
        try {
            console.log(`[AdminService] 发送标签更新请求 ID: ${tagId}, 新名称: ${data.name}`);
            const response = await http.put<Tag>(`/tags/${tagId}`, data);
            console.log('[AdminService] 标签更新成功:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`[AdminService] 标签更新失败 ID: ${tagId}:`, error.response || error);
            // 如果是认证错误，添加更明确的错误信息
            if (error.response?.status === 401) {
                throw new Error('认证失败，请重新登录后再试');
            }
            throw error;
        }
    },

    // --- Add deleteTag method ---
    async deleteTag(tagId: number): Promise<{ message: string }> {
        try {
            console.log(`[AdminService] 发送标签删除请求 ID: ${tagId}`);
            const response = await http.delete<{ message: string }>(`/tags/${tagId}`);
            console.log('[AdminService] 标签删除成功:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`[AdminService] 标签删除失败 ID: ${tagId}:`, error.response || error);
            // 如果是认证错误，添加更明确的错误信息
            if (error.response?.status === 401) {
                throw new Error('认证失败，请重新登录后再试');
            }
            throw error;
        }
    },

    // --- Add createTag method ---
    async createTag(data: { name: string }): Promise<Tag> {
        try {
            console.log(`[AdminService] 发送标签创建请求，名称: ${data.name}`);
            const response = await http.post<Tag>(`/tags`, data);
            console.log('[AdminService] 标签创建成功:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`[AdminService] 标签创建失败，名称: ${data.name}:`, error.response || error);
            // 如果是认证错误，添加更明确的错误信息
            if (error.response?.status === 401) {
                throw new Error('认证失败，请重新登录后再试');
            }
            throw error;
        }
    },

    // --- Statistics --- //
    async getShowcaseStats(): Promise<ShowcaseStatsResponse> {
        try {
            console.log('[AdminService] 获取美食图片统计数据');
            const response = await http.get<ShowcaseStatsResponse>('/food-showcase/stats');
            console.log('[AdminService] 统计数据获取成功:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[AdminService] 统计数据获取失败:', error.response || error);
            // 如果是认证错误，不显示错误提示，因为这可能是公开接口
            if (error.response?.status === 401) {
                throw new Error('认证失败，请重新登录后再试');
            }
            throw new Error('获取统计数据失败');
        }
    },

    // --- Dashboard Stats --- //
    async getDashboardStats(): Promise<DashboardStatsResponse> {
        try {
            console.log('[AdminService] 获取仪表盘统计数据');
            const response = await http.get<DashboardStatsResponse>('/admin/dashboard/stats');
            console.log('[AdminService] 仪表盘统计数据获取成功:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[AdminService] 仪表盘统计数据获取失败:', error.response || error);
            if (error.response?.status === 401) {
                throw new Error('认证失败，请重新登录后再试');
            }
            throw new Error('获取仪表盘统计数据失败');
        }
    }
};