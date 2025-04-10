/**
 * Formats an ISO date string into a relative time description (e.g., "5 分钟前").
 * @param dateString - The ISO date string or Date object.
 * @returns A relative time string.
 */
export function formatTimeAgo(dateString: string | Date | undefined | null): string {
    if (!dateString) return '未知时间';

    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '无效日期';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInMonths = Math.floor(diffInDays / 30); // Approximate
    const diffInYears = Math.floor(diffInDays / 365); // Approximate

    if (diffInYears > 0) return `${diffInYears} 年前`;
    if (diffInMonths > 0) return `${diffInMonths} 个月前`;
    if (diffInDays > 0) return `${diffInDays} 天前`;
    if (diffInHours > 0) return `${diffInHours} 小时前`;
    if (diffInMinutes > 0) return `${diffInMinutes} 分钟前`;
    return `刚刚`; // Or `${diffInSeconds} 秒前` if you prefer more granularity
}

/**
 * Truncates a string to a maximum length and adds an ellipsis if needed.
 * @param text - The input string.
 * @param maxLength - The maximum allowed length.
 * @returns The truncated string with an ellipsis, or the original string.
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
} 