import axios from 'axios';
import { useUserStore } from './stores/modules/user';
import router from './router';

// 创建 Axios 实例
const http = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api', // 从环境变量获取或使用默认值
    timeout: 10000, // 请求超时时间 (10秒)
});

// 在非生产环境下输出调试信息
if (import.meta.env.DEV) {
    console.log('[HTTP] 初始化了Axios实例，baseURL:', http.defaults.baseURL);
}

// 请求拦截器
http.interceptors.request.use(
    (config) => {
        const userStore = useUserStore();
        const storeToken = userStore.token;
        let tokenSource = 'None'; // Track the source

        if (storeToken) {
            config.headers.Authorization = `Bearer ${storeToken}`;
            tokenSource = 'Pinia Store';
        } else {
            const localToken = localStorage.getItem('authToken');
            if (localToken) {
                config.headers.Authorization = `Bearer ${localToken}`;
                tokenSource = 'localStorage';
            }
        }

        // 在非生产环境下输出详细调试信息
        if (import.meta.env.DEV) {
            console.log(`[HTTP Request Interceptor] Sending request to: ${config.url}. Token source: ${tokenSource}. Has Auth Header: ${!!config.headers.Authorization}`);
        }

        return config;
    },
    (error) => {
        // 处理请求错误
        console.error('[HTTP Request Interceptor] Error:', error);
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
        // 在非生产环境下输出详细错误信息
        if (import.meta.env.DEV) {
            console.error('Response interceptor error:', error.response?.status, error.message);
        }

        // 全局错误处理逻辑
        if (error.response) {
            const status = error.response.status;

            // 处理 401 Unauthorized (认证失败)
            if (status === 401) {
                const userStore = useUserStore();
                const currentRoute = router.currentRoute.value;

                if (import.meta.env.DEV) {
                    console.error('[HTTP 401 Interceptor] Unauthorized access. Current route:', currentRoute.fullPath);
                }

                // 只有当当前路由不是登录页时才执行清除和跳转
                if (currentRoute.name !== 'Login') {
                     if (import.meta.env.DEV) {
                        console.log('[HTTP 401 Interceptor] Clearing user state and redirecting to Login.');
                     }
                    // 清除用户信息和 token
                    userStore.logout();
                    // 跳转到登录页，并传递原始路径以便登录后跳回
                    router.push({
                        name: 'Login',
                        query: { redirect: currentRoute.fullPath }
                    });
                } else {
                    // 如果在登录页本身收到 401 (例如，尝试用旧 token 访问需要登录的接口)
                    // 确保状态也被清除了
                     if (import.meta.env.DEV) {
                        console.warn('[HTTP 401 Interceptor] Unauthorized on Login page. Ensuring state is cleared.');
                     }
                    userStore.logout();
                }

                // 返回特定错误信息，标记为认证错误
                error.isAuthError = true;
            }

            // 处理其他状态码
            // 403 Forbidden
            if (status === 403) {
                if (import.meta.env.DEV) {
                    console.error('Forbidden access - insufficient permissions.');
                }
                // 可以在这里添加特定处理
            }
        }

        return Promise.reject(error);
    }
);

export default http;