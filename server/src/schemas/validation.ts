import { z } from 'zod';

export const SearchRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(50).max(50000), // radius in meters
  categories: z.array(z.string()).min(1),
  onlyOpen: z.boolean().default(false),
  onlyWithPhone: z.boolean().default(false),
  minimumRating: z.number().min(0).max(5).default(0),
  minimumReviewCount: z.number().min(0).default(0),
  excludeChains: z.boolean().default(false),
});

export const BusinessUpdateSchema = z.object({
  callingStatus: z.enum([
    'Henüz aranmadı',
    'Arandı, ulaşılmadı',
    'Mesaj atıldı',
    'Mesaja geri dönüş sağlandı',
    'Mesaja geri dönüş sağlandı, müşteri olmak istiyor',
    'İlgileniyor',
    'Teklif istiyor',
    'Daha sonra ara',
    'Web sitesi istemiyor',
    'Yanlış telefon',
    'Müşteriye dönüştü',
  ]).optional(),
  note: z.string().optional(),
});

export const SettingsUpdateSchema = z.object({
  dailyMaxSearches: z.number().min(1).max(1000).optional(),
  maxCategoriesPerSearch: z.number().min(1).max(50).optional(),
  maxBusinessesPerSearch: z.number().min(1).max(1000).optional(),
  isDemoMode: z.boolean().optional(),
  geminiApiKey: z.string().nullable().optional(),
  vercelToken: z.string().nullable().optional(),
});

export const ExcludedBrandSchema = z.object({
  name: z.string().min(1),
});
