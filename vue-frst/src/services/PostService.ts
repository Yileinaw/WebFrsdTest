// src/services/PostService.ts
import http from '@/http';
import type { Post, Comment, PostPreview } from '@/types/models'; // Simplified imports for relevance
import type { CreatePostResponse } from '@/types/payloads';

// Define the specific Paginated response type needed for UserProfileView
// Ensure this matches the structure your backend API actually returns for these endpoints
export interface PaginatedUserPostsResponse {
    posts: Post[];         // Array of Post objects
    currentPage: number;   // Current page number
    totalPages: number;    // Total number of pages
    totalPosts: number;    // Total number of posts
}

// Other necessary interfaces (adjust if needed based on actual usage elsewhere)
interface GetPostsResponse { posts: PostPreview[]; totalCount: number; }
interface GetPostResponse { post: Post; }
interface PostMutationResponse { message: string; post: Post; }
interface CreateCommentResponse { message: string; comment: Comment; }
interface UpdatePostData { title?: string; content?: string; imageUrl?: string | null; }

// --- Post Service Class ---
export class PostService {

    /**
     * 创建帖子 (需要认证)
     */
    static async createPost(data: FormData): Promise<CreatePostResponse> {
        const response = await http.post<CreatePostResponse>('/posts', data);
        return response.data;
    }

    /**
     * 获取帖子列表 (公开，支持分页等参数)
     */
    static async getAllPosts(params?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      search?: string;
      showcase?: boolean;
      currentUserId?: number | null;
    }): Promise<GetPostsResponse> { // Adjust response type if needed
        const response = await http.get<GetPostsResponse>('/posts', { params });
        return response.data;
    }

    /**
     * 获取单个帖子 (公开)
     */
    static async getPostById(id: number): Promise<GetPostResponse> {
        const response = await http.get<GetPostResponse>(`/posts/${id}`);
        return response.data;
    }

    /**
     * 更新帖子 (需要认证)
     */
    static async updatePost(id: number, data: UpdatePostData): Promise<PostMutationResponse> {
        const response = await http.put<PostMutationResponse>(`/posts/${id}`, data);
        return response.data;
    }

    /**
     * 删除帖子 (需要认证)
     */
    static async deletePost(id: number): Promise<void> { // Changed response to void, assuming backend returns 204 or similar
        await http.delete(`/posts/${id}`);
    }

    /**
     * 点赞帖子
     */
    static async likePost(postId: number): Promise<void> {
        await http.post(`/posts/${postId}/like`);
    }

    /**
     * 取消点赞帖子
     */
    static async unlikePost(postId: number): Promise<void> {
        await http.delete(`/posts/${postId}/like`);
    }

    /**
     * 收藏帖子
     */
    static async favoritePost(postId: number): Promise<void> {
        await http.post(`/posts/${postId}/favorite`);
    }

    /**
     * 取消收藏帖子
     */
    static async unfavoritePost(postId: number): Promise<void> {
        await http.delete(`/posts/${postId}/favorite`);
    }

    /**
     * 获取帖子的评论列表
     */
    static async getCommentsByPostId(postId: number): Promise<Comment[]> {
        const response = await http.get<Comment[]>(`/posts/${postId}/comments`);
        return response.data;
    }

    /**
     * 创建评论或回复
     */
    static async createComment(postId: number, data: { text: string; parentId?: number | null }): Promise<CreateCommentResponse> {
        const response = await http.post<CreateCommentResponse>(`/posts/${postId}/comments`, data);
        return response.data;
    }

    /**
     * 删除评论
     */
    static async deleteComment(commentId: number): Promise<void> {
        await http.delete(`/comments/${commentId}`);
    }

    /**
     * 获取当前用户的帖子列表 (可能用于 MyPostsView)
     */
    static async getMyPosts(params?: { page?: number; limit?: number }): Promise<PaginatedUserPostsResponse> { // Use PaginatedUserPostsResponse for consistency if structure matches
        const response = await http.get<PaginatedUserPostsResponse>('/users/me/posts', { params });
        return response.data;
    }

    // --- Methods required by UserProfileView --- //

    /**
     * 获取指定用户的帖子列表 (用于 UserProfileView)
     */
    static async getPostsByUserId(userId: number, page: number = 1, limit: number = 10): Promise<PaginatedUserPostsResponse> {
        console.warn(`[PostService.getPostsByUserId] Fetching posts for user ${userId}, page: ${page}, limit: ${limit}`);
        // Make sure the backend endpoint exists and returns the expected structure
        try {
           const response = await http.get<PaginatedUserPostsResponse>(`/users/${userId}/posts`, {
               params: { page, limit }
           });
           console.log(`[PostService.getPostsByUserId] Received response for user ${userId}:`, response.data);
           // Ensure the response structure matches PaginatedUserPostsResponse, especially the 'posts' array
           return response.data || { posts: [], currentPage: 1, totalPages: 0, totalPosts: 0 };
        } catch (error) {
           console.error(`Error fetching posts for user ${userId}:`, error);
           // Return empty structure on error to prevent breaking the UI
           return { posts: [], currentPage: 1, totalPages: 0, totalPosts: 0 };
        }
    }

    /**
     * 获取指定用户收藏的帖子列表 (用于 UserProfileView)
     */
    static async getFavoritedPosts(userId: number, page: number = 1, limit: number = 10): Promise<PaginatedUserPostsResponse> {
        console.warn(`[PostService.getFavoritedPosts] Fetching favorites for user ${userId}, page: ${page}, limit: ${limit}`);
        // Make sure the backend endpoint exists and returns the expected structure
         try {
            const response = await http.get<PaginatedUserPostsResponse>(`/users/${userId}/favorites`, {
                params: { page, limit }
            });
            console.log(`[PostService.getFavoritedPosts] Received response for user ${userId}:`, response.data);
             // Ensure the response structure matches PaginatedUserPostsResponse
            return response.data || { posts: [], currentPage: 1, totalPages: 0, totalPosts: 0 };
         } catch (error) {
            console.error(`Error fetching favorites for user ${userId}:`, error);
            // Return empty structure on error
            return { posts: [], currentPage: 1, totalPages: 0, totalPosts: 0 };
         }
    }

} // End of PostService class