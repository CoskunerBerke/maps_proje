/**
 * Chain brand matching for the "exclude chains" filter.
 *
 * A brand only matches as a whole word/phrase, so a short brand such as "FLO"
 * no longer hides independent businesses like "Floransa Pastanesi".
 */

/** Lowercases and folds Turkish dotted/dotless i so "LC WAIKIKI" and "LC Waikiki" compare equal. */
export function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/̇/g, '') // combining dot left by "İ".toLowerCase()
    .replace(/ı/g, 'i')
    .normalize('NFC')
    .trim();
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function matchesBrand(placeName: string, brand: string): boolean {
  const normalizedBrand = normalizeForMatch(brand);
  if (!normalizedBrand) return false;
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(normalizedBrand)}(?![\\p{L}\\p{N}])`, 'u');
  return pattern.test(normalizeForMatch(placeName));
}

export function isChainBusiness(placeName: string, brands: string[]): boolean {
  return brands.some((brand) => matchesBrand(placeName, brand));
}
