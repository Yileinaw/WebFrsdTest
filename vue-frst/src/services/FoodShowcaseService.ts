import http from '../http';
import type { FoodShowcasePreview } from '../types/models'; // Ensure this type exists

// Define the expected response structure (array of showcases)
// Assuming the API returns an array directly based on our backend controller

export const FoodShowcaseService = {
  /**
   * Fetches food showcase items, optionally filtered by search term and tag name.
   * @param params - Optional filtering parameters.
   * @param params.search - A search term.
   * @param params.tag - A tag name.
   * @returns A promise resolving to an array of FoodShowcasePreview items.
   */
  async getAllShowcases(params?: { search?: string; tag?: string }): Promise<FoodShowcasePreview[]> {
    console.log('[FoodShowcaseService] Fetching with params:', params);
    try {
      const response = await http.get<FoodShowcasePreview[]>('/food-showcase', { params });
      console.log('[FoodShowcaseService] Response received:', response.data);
      return response.data;
    } catch (error) {
        console.error('[FoodShowcaseService] Error fetching data:', error);
        // Re-throw or handle error as appropriate for your app
        throw error;
    }
  },
}; 