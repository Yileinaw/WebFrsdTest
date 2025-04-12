import http from '@/http';
import type { User } from '@/types/models'; // Import the User type
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
            const response = await http.get<DefaultAvatarsResponse>('/users/avatars/defaults');
            return response.data.avatarUrls || [];
        } catch (error) {
            console.error("Failed to fetch default avatars:", error);
            return [];
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