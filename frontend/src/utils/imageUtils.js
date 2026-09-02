/**
 * Helper utility for parsing and formatting item image URLs
 * Provides 100% backward compatibility for single URL strings, JSON array strings, and comma-separated URLs.
 */

/**
 * Parses image URLs from an item object or raw image_url string
 * @param {object|string|null} itemOrRawUrl 
 * @returns {string[]} Array of valid public image URLs
 */
export function getItemImageUrls(itemOrRawUrl) {
  if (!itemOrRawUrl) return [];

  const raw = typeof itemOrRawUrl === 'string' ? itemOrRawUrl : itemOrRawUrl?.image_url;
  if (!raw || typeof raw !== 'string') return [];

  const trimmed = raw.trim();
  if (!trimmed) return [];

  // 1. JSON Array string representation e.g. '["https://...", "https://..."]'
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((url) => typeof url === 'string' && url.trim().length > 0);
      }
    } catch {
      // Fall through to other checks if JSON parsing fails
    }
  }

  // 2. Comma-separated string
  if (trimmed.includes(',')) {
    return trimmed
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  // 3. Single standard URL string
  return [trimmed];
}

/**
 * Returns the primary (first) image URL for thumbnail/list displays
 * @param {object|string|null} itemOrRawUrl 
 * @returns {string|null}
 */
export function getPrimaryImageUrl(itemOrRawUrl) {
  const urls = getItemImageUrls(itemOrRawUrl);
  return urls.length > 0 ? urls[0] : null;
}

/**
 * Formats an array of image URLs to store in the database column 'image_url'
 * @param {string[]} urls 
 * @returns {string|null}
 */
export function formatItemImageUrls(urls) {
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return null;
  }
  const cleanUrls = urls.filter((u) => typeof u === 'string' && u.trim().length > 0);
  if (cleanUrls.length === 0) return null;
  if (cleanUrls.length === 1) return cleanUrls[0];
  return JSON.stringify(cleanUrls);
}
