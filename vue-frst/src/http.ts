import axios from 'axios';
import { useUserStore } from './stores/modules/user';

// 创建 Axios 实例
const http = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api', // 从环境变量获取或使用默认值
    timeout: 10000, // 请求超时时间 (10秒)
});

// 调试信息
console.log('[HTTP] 初始化了Axios实例，baseURL:', http.defaults.baseURL);

// 请求拦截器
http.interceptors.request.use(
    (config) => {
        // 从 Pinia store 获取 token
        const userStore = useUserStore();
        const token = userStore.token;

        // 如果 Token 存在，则添加到请求头
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('[HTTP] 添加认证头:', `Bearer ${token.substring(0, 10)}...`);
        } else {
            // 尝试从 localStorage 获取 Token 作为备选
            const localToken = localStorage.getItem('authToken');
            if (localToken) {
                config.headers.Authorization = `Bearer ${localToken}`;
                console.log('[HTTP] 从localStorage添加认证头:', `Bearer ${localToken.substring(0, 10)}...`);
            }
        }

        return config;
    },
    (error) => {
        // 处理请求错误
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器 (用于统一错误处理)
http.interceptors.response.use(
    (response) => {
        // 对响应数据做点什么
        return response;
    },
    (error) => {
        // 处理响应错误
        console.error('Response interceptor error:', error.response || error.message);

        // 全局错误处理逻辑
        if (error.response) {
            const status = error.response.status;

            // 处理 401 Unauthorized (认证失败)
            if (status === 401) {
                console.error('Unauthorized access - possibly invalid token.');
                // 获取 userStore 实例
                const userStore = useUserStore();
                // 清除用户信息和 token
                userStore.logout();

                // 如果需要跳转到登录页，可以在这里实现
                // 注意：这里暂时不实现自动跳转，避免循环重定向
                // 如果需要跳转，可以引入 router 并使用 router.push('/login')

                // 返回特定错误信息
                error.isAuthError = true;
            }

            // 处理其他状态码
            // 403 Forbidden
            if (status === 403) {
                console.error('Forbidden access - insufficient permissions.');
                // 可以在这里添加特定处理
            }
        }

        return Promise.reject(error);
    }
);

export default http;