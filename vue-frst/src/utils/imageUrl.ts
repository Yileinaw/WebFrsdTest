/**
 * Constructs the full image URL.
 * Handles different URL formats including Supabase storage URLs.
 *
 * @param url - The URL to process (relative path, absolute URL, or Supabase URL)
 * @returns The full image URL.
 */
export function getImageUrl(url: string | null | undefined): string {
  // 如果URL为空，返回默认图片
  if (!url) {
    return '/assets/images/placeholder.png'; // 默认占位图
  }

  // 处理Supabase URL
  if (url.includes('supabase.co')) {
    // 确保URL包含public访问策略
    if (!url.includes('/object/public/')) {
      // 将storage/v1/替换为storage/v1/object/public/
      return url.replace('/storage/v1/', '/storage/v1/object/public/');
    }
    return url; // 已经是正确的Supabase公共URL
  }

  // 处理其他绝对URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 处理相对路径
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  const serverRootUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  const relativePath = url.startsWith('/') ? url : `/${url}`;

  // 添加时间戳防止缓存问题
  const timestamp = Date.now();
  const separator = relativePath.includes('?') ? '&' : '?';
  return `${serverRootUrl}${relativePath}${separator}t=${timestamp}`;
}