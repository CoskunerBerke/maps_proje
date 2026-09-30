import { describe, it, expect } from 'vitest';
import { buildBusinessWhere, parseCoordinate } from '../utils/businessFilters';

describe('İşletme listesi filtreleri (buildBusinessWhere)', () => {
  it('Varsayılan ve "all_website_less" durumunda potansiyel müşterileri getirmelidir', () => {
    const expected = { websiteStatus: { in: ['no_website', 'social_media_only'] } };
    expect(buildBusinessWhere({}).AND).toEqual([expected]);
    // CRM ve Harita sayfaları status=all_website_less gönderir
    expect(buildBusinessWhere({ status: 'all_website_less' }).AND).toEqual([expected]);
  });

  it('"all" durumunda web sitesi filtresi uygulamamalıdır', () => {
    expect(buildBusinessWhere({ status: 'all' }).AND).toEqual([]);
    expect(buildBusinessWhere({ status: 'has_website' }).AND).toEqual([{ websiteStatus: 'has_website' }]);
  });

  it('Telefon filtresi ve metin araması birbirini ezmemelidir', () => {
    const where = buildBusinessWhere({ status: 'all', onlyWithPhone: 'true', search: '  Örnek ' });
    expect(where.AND).toEqual([
      { OR: [{ nationalPhoneNumber: { not: null } }, { internationalPhoneNumber: { not: null } }] },
      { OR: [{ name: { contains: 'Örnek' } }, { formattedAddress: { contains: 'Örnek' } }] },
    ]);
  });

  it('CRM grubu ve "eski kayıtları gizle" birlikte uygulanmalıdır', () => {
    const where = buildBusinessWhere({ status: 'all', crmGroup: 'arananlar', excludeExisting: 'true' });
    expect(where.AND).toEqual([
      { callingStatus: { not: 'Henüz aranmadı' } },
      { callingStatus: 'Henüz aranmadı' },
      { notes: { none: {} } },
    ]);
  });

  it('Bilinmeyen CRM grubu ve string olmayan parametreler yok sayılmalıdır', () => {
    expect(buildBusinessWhere({ status: 'all', crmGroup: 'bilinmeyen', search: ['a', 'b'] }).AND).toEqual([]);
  });

  it('parseCoordinate geçersiz değerlerde null dönmelidir', () => {
    expect(parseCoordinate('39.93')).toBe(39.93);
    expect(parseCoordinate(32.85)).toBe(32.85);
    expect(parseCoordinate('abc')).toBeNull();
    expect(parseCoordinate(undefined)).toBeNull();
    expect(parseCoordinate('')).toBeNull();
  });
});
