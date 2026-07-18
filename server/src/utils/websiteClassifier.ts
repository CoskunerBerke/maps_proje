const SOCIAL_MEDIA_DOMAINS = [
  'instagram.com',
  'facebook.com',
  'fb.com',
  'tiktok.com',
  'x.com',
  'twitter.com',
  'youtube.com',
  'linkedin.com',
];

export type WebsiteStatus = 'no_website' | 'social_media_only' | 'has_website' | 'unchecked';

/**
 * Classifies a website URI into one of three statuses:
 * - 'no_website': if uri is null, undefined, or empty string.
 * - 'social_media_only': if the website is a social media domain.
 * - 'has_website': if it is a valid website and not a social media domain.
 */
export function classifyWebsite(websiteUri: string | null | undefined): WebsiteStatus {
  if (!websiteUri || websiteUri.trim() === '') {
    return 'no_website';
  }

  const cleanUri = websiteUri.trim().toLowerCase();

  try {
    let hostname = cleanUri;
    if (cleanUri.includes('://')) {
      const url = new URL(cleanUri);
      hostname = url.hostname;
    } else {
      const url = new URL(`http://${cleanUri}`);
      hostname = url.hostname;
    }

    // Remove 'www.' prefix if it exists
    const domain = hostname.startsWith('www.') ? hostname.substring(4) : hostname;

    // Check if the domain matches any social media domain or is a subdomain of it
    const isSocialMedia = SOCIAL_MEDIA_DOMAINS.some(
      (socialDomain) => domain === socialDomain || domain.endsWith(`.${socialDomain}`)
    );

    if (isSocialMedia) {
      return 'social_media_only';
    }

    return 'has_website';
  } catch (error) {
    // Fallback simple string check in case parsing fails
    const isSocial = SOCIAL_MEDIA_DOMAINS.some((socialDomain) => cleanUri.includes(socialDomain));
    if (isSocial) {
      return 'social_media_only';
    }
    return 'has_website';
  }
}
