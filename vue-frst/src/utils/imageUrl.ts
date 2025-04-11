/**
 * Constructs the full image URL.
 * If the provided URL is already absolute (starts with http/https), returns it directly.
 * Otherwise, prepends the API base URL.
 *
 * @param relativeOrAbsoluteUrl - The relative path (e.g., /uploads/...) or potentially an absolute URL.
 * @returns The full image URL.
 */
export function getImageUrl(relativeOrAbsoluteUrl: string | null | undefined): string {
  if (!relativeOrAbsoluteUrl) {
    // Return a default placeholder image URL or an empty string if no URL is provided
    return '/path/to/default/placeholder.png'; // TODO: Replace with your actual placeholder image path
  }

  // Check if it's already an absolute URL
  if (relativeOrAbsoluteUrl.startsWith('http://') || relativeOrAbsoluteUrl.startsWith('https://')) {
    return relativeOrAbsoluteUrl;
  }

  // Assume it's a relative path and construct the URL relative to the backend root
  // Remove the /api part from the base URL if it exists
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'; // Default if not set
  const serverRootUrl = apiBaseUrl.replace(/\/api\/?$/, ''); // Remove /api or /api/

  // Ensure no double slashes between server root and relative path
  const relativePath = relativeOrAbsoluteUrl.startsWith('/') ? relativeOrAbsoluteUrl : `/${relativeOrAbsoluteUrl}`;
  return `${serverRootUrl}${relativePath}`;
} 