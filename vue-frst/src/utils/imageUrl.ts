/**
 * Constructs the full image URL.
 * Handles different URL formats including Supabase storage URLs.
 *
 * @param url - The URL to process (relative path, absolute URL, or Supabase URL)
 * @returns The full image URL.
 */
export function getImageUrl(url: string | null | undefined): string {
  try {
    // 打印调试信息
    console.log(`[getImageUrl] 处理图片URL: ${url}`);

    // 如果URL为空，返回默认图片
    if (!url) {
      console.log('[getImageUrl] URL为空，返回默认占位图');
      return '/assets/images/placeholder.png'; // 默认占位图
    }

    // 处理Supabase URL
    if (url.includes('supabase.co')) {
      console.log('[getImageUrl] 检测到Supabase URL');
      // 确保URL包含public访问策略
      if (!url.includes('/object/public/')) {
        // 将storage/v1/替换为storage/v1/object/public/
        const publicUrl = url.replace('/storage/v1/', '/storage/v1/object/public/');
        console.log(`[getImageUrl] 转换为Supabase公共URL: ${publicUrl}`);
        return publicUrl;
      }
      console.log('[getImageUrl] 已经是正确的Supabase公共URL');
      return url; // 已经是正确的Supabase公共URL
    }

    // 处理其他绝对URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log('[getImageUrl] 使用原始绝对URL');
      return url;
    }

    // 处理相对路径
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    console.log(`[getImageUrl] API基础URL: ${apiBaseUrl}`);

    const serverRootUrl = apiBaseUrl.replace(/\/api\/?$/, '');
    console.log(`[getImageUrl] 服务器根URL: ${serverRootUrl}`);

    const relativePath = url.startsWith('/') ? url : `/${url}`;
    console.log(`[getImageUrl] 相对路径: ${relativePath}`);

    // 添加时间戳防止缓存问题
    const timestamp = Date.now();
    const separator = relativePath.includes('?') ? '&' : '?';
    const finalUrl = `${serverRootUrl}${relativePath}${separator}t=${timestamp}`;

    console.log(`[getImageUrl] 最终URL: ${finalUrl}`);
    return finalUrl;
  } catch (error) {
    console.error('[getImageUrl] 处理URL时出错:', error);
    // 出错时返回默认图片
    return '/assets/images/placeholder.png';
  }
}