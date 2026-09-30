import { Prisma } from '@prisma/client';

/** Website statuses that make a business a potential client (default list). */
export const WEBSITE_LESS_STATUSES = ['no_website', 'social_media_only'];

const CRM_GROUPS: Record<string, Prisma.BusinessWhereInput['callingStatus']> = {
  aranmamis: 'Henüz aranmadı',
  arananlar: { not: 'Henüz aranmadı' },
  olumlu: {
    in: [
      'Müşteriye dönüştü',
      'İlgileniyor',
      'Teklif istiyor',
      'Mesaja geri dönüş sağlandı',
      'Mesaja geri dönüş sağlandı, müşteri olmak istiyor',
    ],
  },
  olumsuz: { in: ['Web sitesi istemiyor', 'Yanlış telefon'] },
  daha_sonra_ara: 'Daha sonra ara',
};

export interface BusinessListQuery {
  status?: unknown; // 'no_website' | 'social_media_only' | 'has_website' | 'all' | 'all_website_less'
  callingStatus?: unknown;
  crmGroup?: unknown;
  onlyWithPhone?: unknown;
  search?: unknown;
  excludeExisting?: unknown;
}

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' ? value : undefined;

/**
 * Builds the Prisma where clause for GET /api/businesses.
 * Every filter is added as a separate AND condition so filters never overwrite
 * each other (e.g. "only with phone" + text search).
 */
export function buildBusinessWhere(query: BusinessListQuery): Prisma.BusinessWhereInput {
  const and: Prisma.BusinessWhereInput[] = [];

  // Website status filter (default and 'all_website_less': potential clients only)
  const status = asString(query.status);
  if (!status || status === 'all_website_less') {
    and.push({ websiteStatus: { in: WEBSITE_LESS_STATUSES } });
  } else if (status !== 'all') {
    and.push({ websiteStatus: status });
  }

  // Phone filter
  if (query.onlyWithPhone === 'true') {
    and.push({
      OR: [
        { nationalPhoneNumber: { not: null } },
        { internationalPhoneNumber: { not: null } },
      ],
    });
  }

  // CRM calling status filter
  const callingStatus = asString(query.callingStatus);
  if (callingStatus) {
    and.push({ callingStatus });
  }

  // CRM group filter
  const crmGroup = asString(query.crmGroup);
  if (crmGroup && CRM_GROUPS[crmGroup]) {
    and.push({ callingStatus: CRM_GROUPS[crmGroup] });
  }

  // Text search filter (name or address)
  const search = asString(query.search)?.trim();
  if (search) {
    and.push({
      OR: [
        { name: { contains: search } },
        { formattedAddress: { contains: search } },
      ],
    });
  }

  // Hide previously processed businesses (called at least once or has notes)
  if (query.excludeExisting === 'true') {
    and.push({ callingStatus: 'Henüz aranmadı' });
    and.push({ notes: { none: {} } });
  }

  return { AND: and };
}

/** Parses an optional coordinate query/body value; returns null when missing or invalid. */
export function parseCoordinate(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}
