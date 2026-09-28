const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

/**
 * Resolves a stored file reference to a viewable URL. New uploads are full
 * S3 URLs (https://...); files uploaded before the S3 migration are still
 * relative `/uploads/...` paths served by the backend.
 */
export function resolveFileUrl(url?: string | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiBaseUrl}${url}`;
}
