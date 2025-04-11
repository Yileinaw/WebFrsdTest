import http from '@/http';
import type { User, Post, Notification } from '@/types/models';
import type { PaginatedResponse } from '@/types/api';
import type { ChangePasswordPayload } from '@/types/payloads';
import type { SuccessMessageResponse } from '@/types/payloads';

// Define specific response types based on backend controllers
interface UserProfileResponse {
    message?: string;
    user: Omit<User, 'password'>;
}

// Define the response type for getting default avatars
interface DefaultAvatarsResponse {
    avatarUrls: string[];
}

// Keep as an exported class with static methods
export class UserService { 

    // 获取当前用户信息 (需要认证)
    static async getMe(): Promise<User> {
        // Using /users/me endpoint which returns the User object directly
        const response = await http.get<UserProfileResponse>('/users/me');
        return response.data.user;
    }

    // 更新用户信息 (名字或预设头像) - Calls PUT /users/me/profile
    static async updateUserProfile(data: { name?: string; avatarUrl?: string | null }): Promise<UserProfileResponse> {
        const payload: { name?: string; avatarUrl?: string | null } = {};
        if (data.name !== undefined) payload.name = data.name;
        // Handle null explicitly for avatar removal
        if (data.avatarUrl !== undefined) payload.avatarUrl = data.avatarUrl; 
        
        // Ensure this matches the backend route /users/me/profile
        const response = await http.put<UserProfileResponse>('/users/me/profile', payload);
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