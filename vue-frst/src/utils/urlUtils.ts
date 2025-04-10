import http from '@/http'; // Import the configured axios instance
// import defaultAvatarPlaceholder from '@/assets/images/default-avatar.png'; // <-- 移除导入

/**
 * Resolves a relative static asset URL from the backend to a full URL.
 * Handles cases where the input URL might be null, undefined, or already absolute.
 * 
 * @param relativeUrl - The relative URL path from the backend (e.g., /uploads/avatars/...) or null/undefined.
 * @returns The full absolute URL or an empty string if the input is invalid.
 */
export const resolveStaticAssetUrl = (relativeUrl: string | null | undefined): string => {
    if (!relativeUrl) {
        return ''; // Return empty string for null, undefined, or empty input
    }

    // If the URL is already absolute, return it directly
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl;
    }

    // Get the API base URL from the http instance
    const apiBaseUrl = http.defaults.baseURL || '';
    
    // Assume the static assets are served from the root of the backend server
    // Remove trailing '/api' or '/api/' if present to get the server root
    const serverRootUrl = apiBaseUrl.replace(/\/api\/?$/, '');

    // Ensure the relative URL starts with a slash
    const path = relativeUrl.startsWith('/') ? relativeUrl : '/' + relativeUrl;

    // Combine server root and path
    const fullUrl = `${serverRootUrl}${path}`;
    
    // console.log(`[resolveStaticAssetUrl] Resolved ${relativeUrl} to ${fullUrl}`);
    return fullUrl;
}; 