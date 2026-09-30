/**
 * Helpers for building HTML from untrusted data (business names, addresses and
 * reviews come from the Google Places API and are written by third parties).
 */

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

/** Escapes a value for use in HTML text content or a quoted attribute value. */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"'`]/g, (ch) => HTML_ESCAPES[ch]);
}

/**
 * Returns the URL only when it is an absolute http(s) URL, otherwise the fallback.
 * Blocks javascript:, data: and other schemes coming from external data.
 */
export function safeHttpUrl(value: string | null | undefined, fallback = ''): string {
  if (!value) return fallback;
  try {
    const url = new URL(value.trim());
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  } catch {
    // not an absolute URL
  }
  return fallback;
}

/** Keeps only characters that are valid in a tel: link (digits, +, spaces, dashes, parentheses). */
export function sanitizePhone(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/[^0-9+\-() ]/g, '').trim();
}
