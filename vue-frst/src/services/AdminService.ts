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
        const response = await http.post<ShowcaseMutationResponse>('/food-showcase', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    async updateFoodShowcase(id: number, formData: FormData): Promise<ShowcaseMutationResponse> {
        // console.warn('[AdminService] updateFoodShowcase: Backend endpoint needs to handle FormData (PUT or POST).'); // Commented out
        // Use PUT and send FormData, ensuring Content-Type is set for file upload
        const response = await http.put<ShowcaseMutationResponse>(`/food-showcase/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }); 
        return response.data;
    },

    async deleteFoodShowcase(id: number): Promise<{ message: string }> {
        // console.warn('[AdminService] deleteFoodShowcase: Backend DELETE endpoint might not exist yet.'); // Commented out
        const response = await http.delete<{ message: string }>(`/food-showcase/${id}`); // Assumes DELETE /food-showcase/:id exists
        return response.data;
    },

    // --- Add Bulk Delete method (now using POST) ---
    async deleteFoodShowcasesBulk(ids: number[]): Promise<{ message: string; count?: number }> { // Update return type if backend changes
        console.log(`[AdminService] Sending bulk delete request (POST) for IDs: ${ids.join(', ')}`);
        // Change to POST and update URL
        const response = await http.post<{ message: string; count?: number }>('/food-showcase/bulk-delete', {
             ids // Send IDs in the request body for POST
        }); 
        return response.data;
    },

    // --- Tag Management --- //
    async getAllTags(): Promise<TagListResponse> {
        // console.warn('[AdminService] getAllTags: Fetching tags from backend GET /tags endpoint.'); // Commented out
        // Remove mock data
        // await new Promise(resolve => setTimeout(resolve, 50));
        // return [{id: 1, name: '早餐'}, {id: 2, name: '午餐'}, ...];
        
        // Fetch tags from the backend API
        try {
            const response = await http.get<TagListResponse>('/tags'); 
            return response.data;
        } catch (error) {
            console.error('[AdminService] Failed to fetch tags from backend:', error);
            ElMessage.error('获取标签列表失败');
            return []; // Return empty array on error
        }
    },

    // --- Add updateTag method ---
    async updateTag(tagId: number, data: { name: string }): Promise<Tag> { // Assume API returns updated Tag
        try {
            const response = await http.put<Tag>(`/tags/${tagId}`, data);
            return response.data;
        } catch (error) {
            console.error(`[AdminService] Failed to update tag ${tagId}:`, error);
            // Consider re-throwing or handling error more specifically
            throw error; // Rethrow to be caught in the component
        }
    },

    // --- Add deleteTag method ---
    async deleteTag(tagId: number): Promise<{ message: string }> { // Assume API returns a message
        try {
            const response = await http.delete<{ message: string }>(`/tags/${tagId}`);
            return response.data;
        } catch (error) {
            console.error(`[AdminService] Failed to delete tag ${tagId}:`, error);
            throw error; // Rethrow to be caught in the component
        }
    },

    // --- Add createTag method ---
    async createTag(data: { name: string }): Promise<Tag> { // Assume API returns the created Tag
        try {
            const response = await http.post<Tag>(`/tags`, data);
            return response.data;
        } catch (error) {
            console.error(`[AdminService] Failed to create tag with name ${data.name}:`, error);
            throw error; // Rethrow to be caught in the component
        }
    },

    // --- Statistics --- //
    async getShowcaseStats(): Promise<ShowcaseStatsResponse> {
        try {
            const response = await http.get<ShowcaseStatsResponse>('/food-showcase/stats');
            return response.data;
        } catch (error) {
            console.error('[AdminService] Failed to fetch showcase stats:', error);
            // Rethrow or return a default structure
            throw new Error('获取统计数据失败'); // Rethrow to be caught in the component
        }
    }
}; 