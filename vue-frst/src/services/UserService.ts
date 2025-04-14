import http from '@/http';
import type { User } from '@/types/models'; // Import the User type
import type { Post } from '@/types/models'; // Ensure Post type is imported
// import type { User, Post, Notification } from '@/types/models'; // 可能不再直接需要 User
// import type { PaginatedResponse } from '@/types/api'; // 可能需要根据后端调整
import type { ChangePasswordPayload } from '@/types/payloads';
import type { SuccessMessageResponse } from '@/types/payloads';

// --- 类型接口定义 ---
// 用于获取用户信息的接口，与后端 getUserById 返回一致
export interface UserProfileData {
    id: number;
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
    bio: string | null;
    joinedAt: string; // ISO Date String
    postCount: number;
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
    favoritesCount?: number; // 添加收藏数 (可选，因为后端刚加)
    // 可能还包含 email, role, isEmailVerified 用于个人设置页
    email?: string;
    role?: string;
    isEmailVerified?: boolean;
}

// 用于更新个人资料后，后端返回的数据结构
// Ensure the user property type matches the store
export interface UpdatedUserProfileResponse {
    message: string;
    user: Omit<User, 'password'>;
}

// 用于获取关注/粉丝列表的分页响应
// (假设后端返回的数据结构如 getFollowers/getFollowing 控制器所示)
export interface PaginatedUserListResponse {
    followers?: UserPublicListData[]; // 对应 getFollowers
    following?: UserPublicListData[]; // 对应 getFollowing
    currentPage: number;
    totalPages: number;
    totalFollowers?: number; // 对应 getFollowers
    totalFollowing?: number; // 对应 getFollowing
}

// 导入 UserPublicListData (如果它在 models.ts 中定义)
// import type { UserPublicListData } from '@/types/models';
// 如果 UserPublicListData 只在此处使用，保持上面的定义即可
export type UserPublicListData = {
    id: number;
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
    bio: string | null;
    isFollowing?: boolean;
}

// Remove unused UserProfileResponse interface
// interface UserProfileResponse {
//     message?: string;
//     user: Omit<User, 'password'>;
// }

// Define the response type for getting default avatars
interface DefaultAvatarsResponse {
    avatarUrls: string[];
}

// Define response structure for user posts (assuming pagination)
interface PaginatedUserPostsResponse {
    posts: Post[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
}

// Keep as an exported class with static methods
export class UserService {

    // 获取当前用户信息 (返回 Omit<User, 'password'>)
    static async getMe(): Promise<Omit<User, 'password'>> {
        // Backend /users/me already returns this structure
        const response = await http.get<Omit<User, 'password'>>('/users/me');
        return response.data;
    }

    // 获取特定用户信息 (返回 UserProfileData)
    // NOTE: Backend /users/:userId should return the public UserProfileData structure.
    static async getUserProfile(userId: number): Promise<UserProfileData> {
        const response = await http.get<UserProfileData>(`/users/${userId}`);
        return response.data;
    }

    // 更新当前用户个人资料
    static async updateMyProfile(data: {
        username?: string;
        name?: string | null;
        bio?: string | null;
        avatarUrl?: string | null;
    }): Promise<UpdatedUserProfileResponse> {
        // Correctly define the payload type inline
        const payload: {
            username?: string;
            name?: string | null;
            bio?: string | null;
            avatarUrl?: string | null;
        } = {};
        if (data.username !== undefined) payload.username = data.username;
        if (data.name !== undefined) payload.name = data.name;
        if (data.bio !== undefined) payload.bio = data.bio;
        if (data.avatarUrl !== undefined) payload.avatarUrl = data.avatarUrl;

        if (Object.keys(payload).length === 0) {
            throw new Error('No update data provided');
        }

        console.log('[UserService.updateMyProfile] Sending payload:', payload);
        // Backend PUT /users/me/profile should return UpdatedUserProfileResponse structure
        const response = await http.put<UpdatedUserProfileResponse>('/users/me/profile', payload);
        console.log('[UserService.updateMyProfile] Received response:', response.data);
        return response.data;
    }

    // 获取头像上传URL (辅助函数) - Points to POST /api/users/me/avatar
    static getUploadAvatarUrl(): string {
        const relativePath = '/users/me/avatar';
        // Construct the full URL using the Axios instance's baseURL
        const baseUrl = (http.defaults.baseURL || '').replace(/\/?$/, ''); // Ensure no trailing slash
        const fullUrl = `${baseUrl}${relativePath}`;
        console.log(`[UserService.getUploadAvatarUrl] Constructed full URL: ${fullUrl}`);
        return fullUrl;
    }

    // 获取预设头像列表 (公开) - Calls GET /users/avatars/defaults
    static async getDefaultAvatars(): Promise<string[]> {
        try {
            // 修改为正确的 Supabase 存储路径格式
            const baseUrl = "https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/preset-avatars";
            // 确保文件名格式正确
            const avatarUrls = Array.from({length: 5}, (_, i) => `${baseUrl}/${i + 1}.jpg?t=${Date.now()}`);
            console.log('Generated avatar URLs:', avatarUrls);
            return avatarUrls;
        } catch (error) {
            console.error('[UserService] Failed to get default avatars:', error);
            throw error;
        }
    }

    // --- 关注/取关 --- //
    static async followUser(userId: number): Promise<void> {
        // 后端成功返回 201，失败返回 4xx/5xx，没有特定 body
        await http.post(`/users/${userId}/follow`);
    }

    static async unfollowUser(userId: number): Promise<void> {
         // 后端成功返回 200，失败返回 4xx/5xx，没有特定 body
        await http.delete(`/users/${userId}/follow`);
    }

    // --- 获取关注/粉丝列表 --- //
    static async getFollowers(userId: number, page: number = 1, limit: number = 10): Promise<PaginatedUserListResponse> {
        const response = await http.get<PaginatedUserListResponse>(`/users/${userId}/followers`, {
            params: { page, limit }
        });
        return response.data;
    }

    static async getFollowing(userId: number, page: number = 1, limit: number = 10): Promise<PaginatedUserListResponse> {
        const response = await http.get<PaginatedUserListResponse>(`/users/${userId}/following`, {
            params: { page, limit }
        });
        return response.data;
    }

    // --- 获取特定用户的帖子列表 --- //
    static async getUserPosts(userId: number, page: number = 1, limit: number = 10): Promise<PaginatedUserPostsResponse> {
        console.log(`[UserService.getUserPosts] Fetching posts for user ${userId}, page ${page}, limit ${limit}`);
        try {
            const response = await http.get<PaginatedUserPostsResponse>(`/users/${userId}/posts`, {
                params: { page, limit }
            });
            console.log(`[UserService.getUserPosts] Received ${response.data.posts?.length} posts, total: ${response.data.totalCount}`);
            // Ensure response structure matches expected type, provide defaults if necessary
            return {
                posts: response.data.posts || [],
                currentPage: response.data.currentPage || page,
                totalPages: response.data.totalPages || 1,
                totalCount: response.data.totalCount || 0
            };
        } catch (error) {
             console.error(`[UserService.getUserPosts] Failed to fetch posts for user ${userId}:`, error);
             // Return empty state on error
             return { posts: [], currentPage: 1, totalPages: 1, totalCount: 0 };
        }
    }

    // --- Add password related methods ---

    /**
     * 请求发送密码重置验证码 (给当前登录用户)
     * Calls POST /api/users/me/send-password-reset-code
     */
    static async sendPasswordResetCode(): Promise<SuccessMessageResponse> {
        const response = await http.post<SuccessMessageResponse>('/users/me/send-password-reset-code');
        return response.data; // Returns { message: "..." }
    }

    /**
     * 修改当前登录用户的密码
     * Calls PUT /api/users/me/password
     * @param payload - Object containing oldPassword, newPassword, confirmPassword, code
     */
    static async changePassword(payload: ChangePasswordPayload): Promise<SuccessMessageResponse> {
        const response = await http.put<SuccessMessageResponse>('/users/me/password', payload);
        return response.data; // Returns { message: "..." }
    }

    // --- End password related methods ---

    // --- Removed duplicate methods and other unused service methods ---
    // If getFavorites, getMyPosts, getNotifications are needed later,
    // they can be added back based on the previous correct implementations.
}


