/**
 * Website / Google Maps links come from the Google Places API (third-party data).
 * Only absolute http(s) URLs are rendered as links, so a "javascript:" URL can
 * never run code in this app.
 */
export function safeExternalUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    // not an absolute URL
  }
  return undefined;
}
