import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyWebsite } from '../utils/websiteClassifier';
import { calculateDistance, formatDistance } from '../utils/distance';

// 1. Mocking Prisma for Database Tests
vi.mock('../db', () => {
  return {
    prisma: {
      business: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
      },
      excludedBrand: {
        findMany: vi.fn().mockResolvedValue([
          { id: '1', name: 'Starbucks' },
          { id: '2', name: 'McDonald\'s' }
        ]),
      },
      appSettings: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'global',
          isDemoMode: true,
        }),
      },
      searchSession: {
        create: vi.fn().mockResolvedValue({ id: 'test-session-id' }),
        update: vi.fn(),
      },
      $transaction: vi.fn().mockResolvedValue([]),
    },
  };
});

import { PlacesService } from '../services/placesService';
import { prisma } from '../db';

describe('Web Sitesi Sınıflandırma Testleri (websiteClassifier)', () => {
  it('websiteUri null olduğunda "no_website" dönmelidir', () => {
    expect(classifyWebsite(null)).toBe('no_website');
    expect(classifyWebsite(undefined)).toBe('no_website');
  });

  it('websiteUri boş string olduğunda "no_website" dönmelidir', () => {
    expect(classifyWebsite('')).toBe('no_website');
    expect(classifyWebsite('   ')).toBe('no_website');
  });

  it('Instagram veya Facebook URLlerinde "social_media_only" dönmelidir', () => {
    expect(classifyWebsite('https://instagram.com/deneme')).toBe('social_media_only');
    expect(classifyWebsite('http://facebook.com/deneme')).toBe('social_media_only');
    expect(classifyWebsite('www.tiktok.com/@deneme')).toBe('social_media_only');
    expect(classifyWebsite('https://x.com/deneme')).toBe('social_media_only');
  });

  it('Normal alan adlarında "has_website" dönmelidir', () => {
    expect(classifyWebsite('https://www.denemeisletmesi.com')).toBe('has_website');
    expect(classifyWebsite('http://cafeankara.com.tr/iletisim')).toBe('has_website');
    expect(classifyWebsite('www.butikgiyim.net')).toBe('has_website');
  });
});

describe('Mesafe Hesaplama Testleri (distance)', () => {
  it('Haversine formülü koordinatlar arası mesafeyi doğru hesaplamalıdır', () => {
    // Ankara Merkez -> Kızılay (yaklaşık 1.48 km / 1480 metre)
    const lat1 = 39.9334;
    const lon1 = 32.8597;
    const lat2 = 39.9208;
    const lon2 = 32.8541;

    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    expect(distance).toBeGreaterThan(1400);
    expect(distance).toBeLessThan(1600);
  });

  it('formatDistance mesafeyi uygun birimde göstermelidir', () => {
    expect(formatDistance(450)).toBe('450 m');
    expect(formatDistance(1480)).toBe('1.5 km');
    expect(formatDistance(5200)).toBe('5.2 km');
  });
});

describe('Places Service Arama & Filtreleme Testleri', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Zincir işletme filtresi aktif olduğunda kara listedeki markalar gizlenmelidir', async () => {
    const searchParams = {
      latitude: 39.9334,
      longitude: 32.8597,
      radius: 3000,
      categories: ['cafe'],
      onlyOpen: false,
      onlyWithPhone: false,
      minimumRating: 0,
      minimumReviewCount: 0,
      excludeChains: true, // zincir işletmeleri hariç tut
    };

    const results = await PlacesService.search(searchParams, 'session-123');
    
    // Starbucks seed verisinde var ama excludeChains=true olduğu için elenmiş olmalı
    const hasStarbucks = results.some(p => p.name.toLowerCase().includes('starbucks'));
    expect(hasStarbucks).toBe(false);
  });

  it('Arama sonucu eklenirken Place ID veritabanı upsert edilmelidir', async () => {
    const searchParams = {
      latitude: 39.9334,
      longitude: 32.8597,
      radius: 3000,
      categories: ['restaurant'],
      onlyOpen: false,
      onlyWithPhone: false,
      minimumRating: 0,
      minimumReviewCount: 0,
      excludeChains: false,
    };

    await PlacesService.search(searchParams, 'session-123');

    // db upsert'in çağrıldığını doğrula
    expect(prisma.business.upsert).toHaveBeenCalled();
  });

  it('Google Places API hata yönetimi düzgün çalışmalıdır', async () => {
    // API anahtarı ayarlı ama fetch hata fırlatacak
    process.env.GOOGLE_MAPS_API_KEY = 'GECERSIZ_API_ANAHTARI';
    
    // Setting global to not demo mode
    vi.mocked(prisma.appSettings.findUnique).mockResolvedValueOnce({
      id: 'global',
      dailyMaxSearches: 100,
      maxCategoriesPerSearch: 10,
      maxBusinessesPerSearch: 100,
      isDemoMode: false, // Gerçek mod
    });

    // Mock global fetch to reject
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(() => 
      Promise.resolve({
        ok: false,
        status: 400,
        text: () => Promise.resolve('API Key Invalid')
      })
    );

    const searchParams = {
      latitude: 39.9334,
      longitude: 32.8597,
      radius: 3000,
      categories: ['restaurant'],
      onlyOpen: false,
      onlyWithPhone: false,
      minimumRating: 0,
      minimumReviewCount: 0,
      excludeChains: false,
    };

    await expect(PlacesService.search(searchParams, 'session-123')).rejects.toThrow();

    // Restore fetch
    global.fetch = originalFetch;
    delete process.env.GOOGLE_MAPS_API_KEY;
  });
});
