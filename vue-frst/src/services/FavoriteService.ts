import http from '@/http';
import type { Post } from '@/types/models';

// Define the expected API response structure for favorites
interface GetFavoritesResponse {
    posts: Post[];
    totalCount: number;
    // Add other pagination fields if returned by backend
    currentPage?: number;
    totalPages?: number;
}

// --- Favorite Service Class ---
export class FavoriteService {
    /**
     * Get the current user's favorited posts.
     */
    static async getMyFavorites(params?: { page?: number; limit?: number }): Promise<GetFavoritesResponse> {
        // Assuming backend route is /api/users/me/favorites
        const response = await http.get<GetFavoritesResponse>('/users/me/favorites', { params });
        return response.data;
    }
} // End of FavoriteService class 