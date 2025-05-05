import http from '@/http';
// Assuming FoodShowcasePreview and Tag are correctly defined and exported from models.ts
import type { FoodShowcasePreview, Tag } from '@/types/models';
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
        type: string; // 'food' 或 'post'
    }>;
    recentContent: Array<{
        id: number;
        title: string;
        type: string; // 'post' 或 'showcase'
        createdAt: string;
    }>;
}

// 用户角色检查响应接口
interface AdminRoleCheckResponse {
    userId: number;
    role: string;
    isAdmin: boolean;
    isModerator: boolean;
    hasAdminAccess: boolean;
}

// Export the service object
export const AdminService = {

    // --- Food Showcase Management --- //
    async getFoodShowcases(params: {
        page?: number;
        limit?: number;
        includeTags?: boolean;
        search?: string;
        tags?: string;
    } = {}): Promise<PaginatedFoodShowcaseResponse> {
        try {
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
                queryParams.append('tags', tags);
            }

            const response = await http.get<PaginatedFoodShowcaseResponse>(`/food-showcase?${queryParams.toString()}`);
            return response.data;
        } catch (error: any) {
            if (import.meta.env.DEV) {
                console.error('[AdminService] 获取美食展示列表失败:', error.response || error);
            }
            throw new Error('获取美食展示列表失败');
        }
    },

    /**
     * 创建新的美食展示项
     * Calls POST /api/food-showcase
     */
    async createFoodShowcase(formData: FormData): Promise<ShowcaseMutationResponse> {
        try {
            // Remove /api prefix
            const response = await http.post<ShowcaseMutationResponse>('/food-showcase', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('[AdminService] Error creating food showcase:', error);
            throw new Error(error.response?.data?.message || '创建美食展示失败');
        }
    },

    /**
     * 更新美食展示项
     * Calls PUT /api/food-showcase/:id
     */
    async updateFoodShowcase(id: number, formData: FormData): Promise<ShowcaseMutationResponse> {
        try {
            // Remove /api prefix
            const response = await http.put<ShowcaseMutationResponse>(`/food-showcase/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error(`[AdminService] Error updating food showcase ${id}:`, error);
            throw new Error(error.response?.data?.message || '更新美食展示失败');
        }
    },

    /**
     * 删除美食展示项
     * Calls DELETE /api/food-showcase/:id
     */
    async deleteFoodShowcase(id: number): Promise<{ message: string }> {
        try {
            // Remove /api prefix
            const response = await http.delete<{ message: string }>(`/food-showcase/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`[AdminService] Error deleting food showcase ${id}:`, error);
            throw new Error(error.response?.data?.message || '删除美食展示失败');
        }
    },

    /**
     * 批量删除美食展示项
     * Calls POST /api/food-showcase/bulk-delete
     */
    async bulkDeleteFoodShowcases(ids: number[]): Promise<{ message: string; count?: number }> {
        try {
            // Remove /api prefix
            const response = await http.post<{ message: string; count?: number }>('/food-showcase/bulk-delete', {
                ids: ids
            });
            return response.data;
        } catch (error: any) {
            console.error('[AdminService] Error bulk deleting food showcases:', error);
            throw new Error(error.response?.data?.message || '批量删除美食展示失败');
        }
    },

    // --- Tag Management --- //
    /**
     * 获取所有标签 (已弃用, 请使用 PostTagService 或 FoodTagService)
     */
    async getAllTags(tagType: 'post' | 'food' = 'food'): Promise<TagListResponse> {
        console.warn('[AdminService] getAllTags方法已弃用，请使用PostTagService或FoodTagService');
        const endpoint = tagType === 'post' ? '/post-tags' : '/food-tags';
        try {
            // Remove /api prefix
            const response = await http.get<TagListResponse>(endpoint);
            return response.data;
        } catch (error: any) {
            console.error(`[AdminService] 标签列表获取失败:`, error);
            throw new Error('获取标签列表失败');
        }
    },

    // --- Add updateTag method ---
    // 已分离到PostTagService和FoodTagService中
    async updateTag(tagId: number, data: { name: string }): Promise<Tag> {
        console.warn('[AdminService] updateTag方法已弃用，请使用PostTagService或FoodTagService');
        try {
            console.log(`[AdminService] 发送标签更新请求 ID: ${tagId}, 新名称: ${data.name}`);
            const response = await http.put<Tag>(`/food-tags/${tagId}`, data); // 默认使用美食标签
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
    // 已分离到PostTagService和FoodTagService中
    async deleteTag(tagId: number): Promise<{ message: string }> {
        console.warn('[AdminService] deleteTag方法已弃用，请使用PostTagService或FoodTagService');
        try {
            console.log(`[AdminService] 发送标签删除请求 ID: ${tagId}`);
            const response = await http.delete<{ message: string }>(`/food-tags/${tagId}`); // 默认使用美食标签
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

    /**
     * 创建新标签 (已弃用, 请使用 PostTagService 或 FoodTagService)
     */
    async createTag(name: string, tagType: 'post' | 'food' = 'food'): Promise<Tag> {
        console.warn('[AdminService] createTag方法已弃用，请使用PostTagService或FoodTagService');
        const endpoint = tagType === 'post' ? '/post-tags' : '/food-tags';
        try {
            // Remove /api prefix
            const response = await http.post<Tag>(endpoint, { name });
            return response.data;
        } catch (error: any) {
            console.error(`[AdminService] 创建标签失败:`, error);
            throw new Error(error.response?.data?.message || '创建标签失败');
        }
    },

    // --- Statistics --- //
    /**
     * 获取美食展示统计信息
     * Calls GET /api/food-showcase/stats
     */
    async getShowcaseStats(): Promise<ShowcaseStatsResponse> {
        try {
            // Remove /api prefix
            const response = await http.get<ShowcaseStatsResponse>('/food-showcase/stats');
            return response.data;
        } catch (error: any) {
            console.error('[AdminService] 获取美食展示统计失败:', error);
            throw new Error(error.response?.data?.message || '获取统计信息失败');
        }
    },

    // --- Admin Role Check ---
    /**
     * 检查当前用户是否是管理员
     * Calls GET /api/admin/check-role
     */
    async checkAdminRole(): Promise<AdminRoleCheckResponse> {
        try {
            // Remove /api prefix
            const response = await http.get<AdminRoleCheckResponse>('/admin/check-role');
            return response.data;
        } catch (error: any) {
            console.error('[AdminService] 检查管理员角色失败:', error);
            // 如果是403 Forbidden，说明用户不是管理员
            if (error.response?.status === 403) {
                // 返回符合 AdminRoleCheckResponse 结构的对象
                return {
                    userId: 0, // Assuming 0 or null indicates no specific user ID in this context
                    role: 'user', // Default to 'user' role
                    isAdmin: false,
                    isModerator: false,
                    hasAdminAccess: false
                };
            }
            throw new Error(error.response?.data?.message || '检查权限失败');
        }
    },

    // --- Development Only - Make Admin ---
    /**
     * (开发用) 将指定用户设置为管理员
     * Calls POST /api/auth/dev/make-admin
     */
    async makeUserAdmin(userId: number): Promise<{ message: string; user: any }> {
        if (import.meta.env.PROD) {
            throw new Error('This function is only available in development mode.');
        }
        try {
            // Remove /api prefix
            const response = await http.post<{ message: string; user: any }>('/auth/dev/make-admin', { userId });
            return response.data;
        } catch (error: any) {
            console.error(`[AdminService] 设为管理员失败 (用户ID: ${userId}):`, error);
            throw new Error(error.response?.data?.message || '设置管理员失败');
        }
    },

    // --- Dashboard Stats --- (Placeholder)
    /**
     * 获取管理员仪表盘统计数据
     * Calls GET /api/admin/dashboard/stats
     */
    async getDashboardStats(): Promise<DashboardStatsResponse> {
        console.log('[AdminService] Fetching dashboard stats...');
        try {
            // Remove /api prefix
            const response = await http.get<DashboardStatsResponse>('/admin/dashboard/stats');
            console.log('[AdminService] Dashboard stats fetched:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[AdminService] 获取仪表盘统计失败:', error);
            // Provide a more specific error message
            const message = error.response?.data?.message || '获取仪表盘统计数据失败，请稍后重试。';
            // Rethrow a new error with the potentially more informative message
            throw new Error(message);
        }
    },
};