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
        tags?: string[];
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
                queryParams.append('tags', tags.join('|'));
            }

            const response = await http.get<PaginatedFoodShowcaseResponse>(`/api/food-showcase?${queryParams.toString()}`);
            return response.data;
        } catch (error: any) {
            if (import.meta.env.DEV) {
                console.error('[AdminService] 获取美食展示列表失败:', error.response || error);
            }
            throw new Error('获取美食展示列表失败');
        }
    },

    async createFoodShowcase(formData: FormData): Promise<ShowcaseMutationResponse> {
        try {
            console.log('[AdminService] 发送美食图片上传请求');
            const response = await http.post<ShowcaseMutationResponse>('/api/food-showcase', formData, {
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
            const response = await http.put<ShowcaseMutationResponse>(`/api/food-showcase/${id}`, formData, {
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
            const response = await http.delete<{ message: string }>(`/api/food-showcase/${id}`);
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
            const response = await http.post<{ message: string; count?: number }>('/api/food-showcase/bulk-delete', {
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
    // 已分离到PostTagService和FoodTagService中
    async getAllTags(): Promise<TagListResponse> {
        console.warn('[AdminService] getAllTags方法已弃用，请使用PostTagService或FoodTagService');
        try {
            console.log('[AdminService] 获取标签列表');
            const response = await http.get<TagListResponse>('/api/food-tags'); // 默认使用美食标签
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
    // 已分离到PostTagService和FoodTagService中
    async updateTag(tagId: number, data: { name: string }): Promise<Tag> {
        console.warn('[AdminService] updateTag方法已弃用，请使用PostTagService或FoodTagService');
        try {
            console.log(`[AdminService] 发送标签更新请求 ID: ${tagId}, 新名称: ${data.name}`);
            const response = await http.put<Tag>(`/api/food-tags/${tagId}`, data); // 默认使用美食标签
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
            const response = await http.delete<{ message: string }>(`/api/food-tags/${tagId}`); // 默认使用美食标签
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
    // 已分离到PostTagService和FoodTagService中
    async createTag(data: { name: string }): Promise<Tag> {
        console.warn('[AdminService] createTag方法已弃用，请使用PostTagService或FoodTagService');
        try {
            console.log(`[AdminService] 发送标签创建请求，名称: ${data.name}`);
            const response = await http.post<Tag>(`/api/food-tags`, data); // 默认使用美食标签
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
            const response = await http.get<ShowcaseStatsResponse>('/api/food-showcase/stats');
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

    // --- Admin Role Check --- //
    async checkAdminRole(): Promise<AdminRoleCheckResponse> {
        try {
            console.log('[AdminService] 检查管理员角色');
            const response = await http.get<AdminRoleCheckResponse>('/api/admin/check-role');
            console.log('[AdminService] 角色检查成功:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[AdminService] 角色检查失败:', error.response || error);

            if (error.response) {
                if (error.response.status === 401) {
                    throw new Error('认证失败，请重新登录后再试');
                } else if (error.response.status === 403) {
                    throw new Error('权限不足，需要管理员权限');
                }
            }

            throw new Error('检查管理员角色失败');
        }
    },

    // --- Make Admin (Development Only) --- //
    async makeAdmin(): Promise<{ message: string; user: any }> {
        try {
            console.log('[AdminService] 将当前用户设置为管理员');
            const response = await http.post<{ message: string; user: any }>('/api/auth/dev/make-admin');
            console.log('[AdminService] 设置管理员成功:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[AdminService] 设置管理员失败:', error.response || error);

            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            }

            throw new Error('设置管理员失败');
        }
    },

    // --- Dashboard Stats --- //
    async getDashboardStats(): Promise<DashboardStatsResponse> {
        try {
            console.log('[AdminService] 获取仪表盘统计数据');
            // 修正API路径，使用 /api/admin/dashboard/stats 而不是 /admin/dashboard/stats
            const response = await http.get<DashboardStatsResponse>('/api/admin/dashboard/stats');
            console.log('[AdminService] 仪表盘统计数据获取成功:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[AdminService] 仪表盘统计数据获取失败:', error.response || error);

            // 检查是否有响应数据
            if (error.response) {
                // 服务器返回了错误响应
                if (error.response.status === 401) {
                    throw new Error('认证失败，请重新登录后再试');
                } else if (error.response.status === 403) {
                    throw new Error('权限不足，需要管理员权限');
                } else if (error.response.data && error.response.data.message) {
                    // 使用服务器返回的错误消息
                    throw new Error(error.response.data.message);
                }
            }

            // 如果没有特定错误信息，使用通用错误消息
            throw new Error(error.message || '获取仪表盘统计数据失败');
        }
    }
};