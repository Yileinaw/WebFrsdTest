import http from '../http'; // 导入配置好的 Axios 实例
import type { User } from '../types/models';
import type { SuccessMessageResponse } from '@/types/payloads'; // Import from the correct shared location

// 定义注册请求的数据类型 (根据后端需要)
interface RegisterData {
    email: string;
    password?: string; // 注册时密码通常是必须的
    name?: string;
    username?: string; // Add username field
}

// Define the input type for login, now using identifier
interface LoginPayload {
    identifier: string;
    password: string;
}

// 定义登录响应的数据类型 (根据后端返回)
export interface LoginResponse {
    message: string;
    token: string;
    user: Omit<User, 'password'>; // 假设后端返回不含密码的用户信息
}

// 定义注册响应的数据类型
interface RegisterResponse {
    message: string;
    user: Omit<User, 'password'>;
}

// Define payload for resetting password
interface ResetPasswordData {
    email: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
}

export const AuthService = {
    async register(data: RegisterData): Promise<RegisterResponse> {
        // 注意：Axios 返回的数据在 response.data 中
        const response = await http.post<RegisterResponse>('/auth/register', data);
        return response.data;
    },

    // Login accepts identifier and determines payload for backend
    async login(payload: LoginPayload): Promise<LoginResponse> {
        const { identifier, password } = payload;
        const isEmail = identifier.includes('@');
        
        // Construct the data object based on whether it's an email or username
        const requestData = isEmail 
            ? { email: identifier, password }
            : { username: identifier, password };
            
        // Call the backend /login endpoint with the correct data structure
        const response = await http.post<LoginResponse>('/auth/login', requestData);
        return response.data;
    },

    // 获取当前用户信息 (使用 GET 请求，需要认证)
    async getCurrentUser(): Promise<{ user: Omit<User, 'password'> }> {
        // Fetch the user object directly (backend returns the object, not nested)
        const response = await http.get<Omit<User, 'password'>>('/users/me');
        // Wrap the received user data into the expected structure
        return { user: response.data }; 
    },

    /**
     * 公开接口：请求发送密码重置验证码
     * Calls POST /api/auth/send-password-reset-code
     * @param email - User's email address
     */
    async sendPublicPasswordResetCode(email: string): Promise<SuccessMessageResponse> {
        const response = await http.post<SuccessMessageResponse>('/auth/send-password-reset-code', { email });
        return response.data; // Returns { message: "..." }
    },

    /**
     * 使用验证码重置密码
     * Calls POST /api/auth/reset-password
     */
    async resetPassword(data: ResetPasswordData): Promise<SuccessMessageResponse> {
        const response = await http.post<SuccessMessageResponse>('/auth/reset-password', data);
        return response.data; // Returns { message: "..." }
    },

    /**
     * 验证邮箱 Token
     * Calls GET /api/auth/verify-email?token=...
     */
    async verifyEmail(token: string): Promise<SuccessMessageResponse> {
        // Send token as a query parameter
        const response = await http.get<SuccessMessageResponse>('/auth/verify-email', {
            params: { token } 
        });
        return response.data; // Returns { message: "..." }
    },

    /**
     * 请求重新发送邮箱验证邮件
     * Calls POST /api/auth/resend-verification
     */
    async resendVerificationEmail(email: string): Promise<SuccessMessageResponse> {
        const response = await http.post<SuccessMessageResponse>('/auth/resend-verification', { email });
        return response.data;
    }
}; 