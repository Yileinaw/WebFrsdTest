import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// import { useRouter } from 'vue-router' // 如果 logout 需要跳转，则保留
// 从 types 文件导入共享类型
// import type { UserInfo, LoginCredentials, RegisterInfo } from '@/types/api' // 移除旧的
// 导入 API 调用函数
// import { loginApi, registerApi } from '@/services/modules/auth' // 移除 API 导入，因为 actions 不再调用 API
// 从新的类型文件导入 User
import type { User } from '@/types/models'
import { AuthService } from '@/services/AuthService'
import { UserService } from '@/services/UserService'
import http from '@/http'
import type { LoginResponse } from '@/services/AuthService'

// Define a more specific type for currentUser state, including role
type CurrentUserType = Omit<User, 'password'> | null;

interface LoginPayload {
    identifier: string;
    password: string;
}

export const useUserStore = defineStore('user', () => {
    // --- State --- 
    // 使用 ref 定义状态属性
    const token = ref(localStorage.getItem('authToken') || null) // 尝试从 localStorage 读取初始 token
    
    // Wrap currentUser initialization in try-catch
    let initialUser: CurrentUserType = null;
    try {
        const storedUserInfo = localStorage.getItem('currentUserInfo');
        if (storedUserInfo) {
            initialUser = JSON.parse(storedUserInfo) as CurrentUserType;
            console.log('[UserStore Init] Successfully parsed currentUserInfo from localStorage:', initialUser);
        } else {
            console.log('[UserStore Init] No currentUserInfo found in localStorage.');
        }
    } catch (error) {
        console.error('[UserStore Init] Failed to parse currentUserInfo from localStorage:', error);
        // Optionally remove corrupted data
        // localStorage.removeItem('currentUserInfo'); 
    }
    const currentUser = ref<CurrentUserType>(initialUser) // 使用解析后的或 null 初始化

    // --- Getters --- 
    // 使用 computed 定义 getters
    const isLoggedIn = computed(() => !!token.value && !!currentUser.value)
    const userName = computed(() => currentUser.value?.name || '游客') // 使用 name 而不是 nickname
    const userAvatar = computed(() => '') // 假设目前 User 模型没有头像字段
    const resolvedAvatarUrl = computed(() => {
        const url = currentUser.value?.avatarUrl;
        console.log('[resolvedAvatarUrl] Current avatarUrl from state:', url);

        let urlToResolve: string; // Define urlToResolve outside the blocks

        if (!url) {
            const defaultAvatarPath = '/avatars/defaults/1.jpg'; // Fallback to default preset
            console.log(`[resolvedAvatarUrl] URL is null/undefined, falling back to default path: ${defaultAvatarPath}`);
            // Note: Ensure '1.jpg' exists in backend/public/avatars/defaults/
            urlToResolve = defaultAvatarPath; // Assign to the outer variable
        } else {
            urlToResolve = url; // Assign to the outer variable
        }

        // Common resolving logic - now urlToResolve is accessible
        if (urlToResolve.startsWith('http://') || urlToResolve.startsWith('https://')) {
            console.log('[resolvedAvatarUrl] URL is absolute:', urlToResolve);
            return urlToResolve;
        }
        const apiBaseUrl = http.defaults.baseURL || '';
        const staticBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
        const relativeUrl = urlToResolve.startsWith('/') ? urlToResolve : '/' + urlToResolve;
        const finalUrl = `${staticBaseUrl}${relativeUrl}`;
        console.log('[resolvedAvatarUrl] Resolved final URL:', finalUrl);
        return finalUrl;
    })

    // --- Add isAdmin Getter ---
    const isAdmin = computed(() => {
        console.log('[isAdmin getter] Checking role:', currentUser.value?.role);
        // Use type assertion to tell TS that role might exist
        // 修改为不区分大小写的比较
        return (currentUser.value as User | null)?.role?.toLowerCase() === 'admin';
    });

    // --- Actions --- 
    // const router = useRouter() // 如果 logout 需要跳转，则保留

    // 辅助函数：设置 Token 和用户信息 (内部使用，保持不变)
    // 将函数名改为内部使用约定 (_)
    function _setLoginInfo(newToken: string | null, userInfo: CurrentUserType) {
        console.log('[_setLoginInfo] Called with token:', newToken, 'User Info:', userInfo);
        console.log('[_setLoginInfo] UserInfo includes role?:', userInfo ? ('role' in userInfo) : 'N/A');
        const oldAvatar = currentUser.value?.avatarUrl;
        token.value = newToken
        currentUser.value = userInfo
        console.log('[_setLoginInfo] currentUser.value AFTER setting:', currentUser.value);
        localStorage.setItem('authToken', newToken || '')
        if (userInfo) {
            localStorage.setItem('currentUserInfo', JSON.stringify(userInfo))
        } else {
            localStorage.removeItem('currentUserInfo')
            // Keep token removal logic here?
            // localStorage.removeItem('authToken') // Maybe only remove token on explicit logout?
        }
        if (newToken) {
            http.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        } else {
            delete http.defaults.headers.common['Authorization'];
        }
        console.log('[_setLoginInfo] Avatar URL changed:', oldAvatar, '->', currentUser.value?.avatarUrl);
    }

    // --- 新增 Action: 设置 Token ---
    function setToken(newToken: string | null) {
        console.log('[setToken] Called with:', newToken);
        // Preserve existing user info when only setting token
        _setLoginInfo(newToken, currentUser.value);
    }

    // --- 新增 Action: 设置用户信息 ---
    function setUser(userInfo: CurrentUserType) {
        console.log('[setUser] Called with userInfo:', JSON.stringify(userInfo)); // Log input
        console.log('[setUser] UserInfo includes counts?:',
          userInfo ? `post: ${'postCount' in userInfo}, follower: ${'followerCount' in userInfo}, following: ${'followingCount' in userInfo}, favorites: ${'favoritesCount' in userInfo}` : 'N/A');
        
        const oldUserInfo = JSON.stringify(currentUser.value); // Log previous state
        
        // Preserve existing token when only setting user
        _setLoginInfo(token.value, userInfo); 

        // +++ Log the state AFTER update +++
        console.log('[setUser] currentUser state BEFORE update:', oldUserInfo);
        console.log('[setUser] currentUser state AFTER update:', JSON.stringify(currentUser.value));
    }

    // --- 新增 Action: 登录 ---
    // Accept LoginPayload with identifier
    async function login(payload: LoginPayload): Promise<LoginResponse> {
        console.log('[login] Attempting login with identifier:', payload.identifier);
        // Pass identifier and password directly to AuthService.login
        const response = await AuthService.login(payload); 
        
        // AuthService.login now handles fetching user profile internally
        // If it resolves, it means both token and user are fetched successfully
        
        // Use the user data returned by AuthService.login to set the state
        // Assuming _setLoginInfo is still the correct way to set token and user
        _setLoginInfo(response.token, response.user);
        
        console.log('[login] Login and profile fetch successful in store.');
        return response; // Return the full response { token, user }
    }

    // --- 新增 Action: 获取用户信息 --- (Keep for explicit profile fetching if needed, e.g., on refresh)
    async function fetchUserProfile() {
        console.log('[fetchUserProfile] Fetching profile...');
        if (!token.value) {
            console.log('[fetchUserProfile] No token, aborting.');
            return; 
        }
        try {
            const response = await AuthService.getCurrentUser();
            // +++ Log the exact response from API +++
            console.log('[fetchUserProfile] API success, received RAW user data:', JSON.stringify(response.user)); 
            setUser(response.user); // Use setUser to update state
        } catch (error) {
            console.error("[fetchUserProfile] Failed:", error);
            logout(); 
        }
    }

    // --- 新增 Action: 更新用户信息 ---
    function updateUserInfo(updatedUser: Partial<Omit<User, 'password'>>) {
        console.log('[updateUserInfo] Updating with:', updatedUser);
        if (currentUser.value) {
            const oldAvatar = currentUser.value.avatarUrl;
            currentUser.value = { ...currentUser.value, ...updatedUser };
            console.log('[updateUserInfo] Avatar URL changed:', oldAvatar, '->', currentUser.value.avatarUrl);
            // Persist merged user info to localStorage
            localStorage.setItem('currentUserInfo', JSON.stringify(currentUser.value));
        } else {
            console.warn("[updateUserInfo] No current user to update.");
        }
    }

    // --- 新增 Action: 更新头像 URL ---
    // Accept string or null, and call backend API
    async function updateAvatarUrl(newAvatarUrl: string | null) {
        console.log('[updateAvatarUrl] Updating avatar URL to:', newAvatarUrl);
        if (!currentUser.value) {
            console.warn("[updateAvatarUrl] No current user to update.");
            throw new Error('用户未登录'); // Throw error if no user
        }

        const userId = currentUser.value.id;

        try {
            // Call backend API to persist the change
            console.log(`[updateAvatarUrl] Calling UserService.updateProfile for user ${userId} with avatarUrl:`, newAvatarUrl);
            // Use updateMyProfile which seems to be the correct method based on UserController
            const response = await UserService.updateMyProfile({ avatarUrl: newAvatarUrl });
            console.log('[updateAvatarUrl] Backend update response:', response);

            if (response && response.user) {
                // Backend successful, now update local state
                const oldAvatar = currentUser.value.avatarUrl;
                // IMPORTANT: Use the user data returned from the backend to ensure consistency
                // This updates the entire user object, not just avatarUrl
                setUser(response.user); // Use setUser to update the whole user object
                // currentUser.value = { ...currentUser.value, avatarUrl: newAvatarUrl }; // Old way, less safe
                console.log('[updateAvatarUrl] Local store updated using setUser. Avatar URL changed:', oldAvatar, '->', currentUser.value?.avatarUrl);
                // localStorage update is handled within setUser -> _setLoginInfo
            } else {
                 throw new Error('后端更新头像后响应无效');
            }

        } catch (error) {
            console.error("[updateAvatarUrl] Failed to update avatar via backend:", error);
            // Rethrow or handle error appropriately, maybe show a message to the user
            throw error; // Rethrow to be caught by the calling component
        }
    }

    // --- 修改 Action: 登出 ---
    function logout() {
        console.log('[logout] Logging out...');
        _setLoginInfo(null, null);
         // Also remove token from localStorage on explicit logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUserInfo'); // Ensure user info is also removed
        // Ensure header is cleared
        if (http && http.defaults && http.defaults.headers && http.defaults.headers.common) {
             delete http.defaults.headers.common['Authorization']; 
        }
    }

    // +++ 新增 Actions: 更新关注/粉丝数量 +++
    function incrementFollowingCount() {
        if (currentUser.value) {
            currentUser.value.followingCount = (currentUser.value.followingCount ?? 0) + 1;
            localStorage.setItem('currentUserInfo', JSON.stringify(currentUser.value));
            console.log('[incrementFollowingCount] Updated following count in store:', currentUser.value.followingCount);
        }
    }

    function decrementFollowingCount() {
        if (currentUser.value && currentUser.value.followingCount) {
            currentUser.value.followingCount = Math.max(0, currentUser.value.followingCount - 1);
            localStorage.setItem('currentUserInfo', JSON.stringify(currentUser.value));
            console.log('[decrementFollowingCount] Updated following count in store:', currentUser.value.followingCount);
        }
    }

    function incrementFollowerCount() {
        if (currentUser.value) {
            currentUser.value.followerCount = (currentUser.value.followerCount ?? 0) + 1;
            localStorage.setItem('currentUserInfo', JSON.stringify(currentUser.value));
            console.log('[incrementFollowerCount] Updated follower count in store:', currentUser.value.followerCount);
        }
    }

    function decrementFollowerCount() {
        if (currentUser.value && currentUser.value.followerCount) {
            currentUser.value.followerCount = Math.max(0, currentUser.value.followerCount - 1);
            localStorage.setItem('currentUserInfo', JSON.stringify(currentUser.value));
            console.log('[decrementFollowerCount] Updated follower count in store:', currentUser.value.followerCount);
        }
    }

    // --- Return --- 
    // 暴露 state, getters, 和 actions
    return {
        token,
        currentUser,
        isLoggedIn,
        userName,
        userAvatar,
        resolvedAvatarUrl,
        setToken,
        setUser,
        login,
        fetchUserProfile,
        updateUserInfo,
        updateAvatarUrl,
        logout,
        isAdmin,
        // +++ 暴露新的 actions +++
        incrementFollowingCount,
        decrementFollowingCount,
        incrementFollowerCount,
        decrementFollowerCount
    }
}) 