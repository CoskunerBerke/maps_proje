import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { once } from 'events';
import type { AddressInfo } from 'net';
import type { Server } from 'http';

// In-memory stand-in for the SearchSession table. count() and create() wait a
// moment like real database calls, so two requests can interleave.
const sessions: { id: string; createdAt: Date; requestCount: number; status: string }[] = [];
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

vi.mock('../db', () => ({
  prisma: {
    appSettings: {
      findUnique: vi.fn(async () => ({
        id: 'global',
        isDemoMode: false,
        dailyMaxSearches: 1,
        maxCategoriesPerSearch: 10,
        maxBusinessesPerSearch: 100,
      })),
    },
    searchSession: {
      count: vi.fn(async ({ where }: any) => {
        await tick();
        return sessions.filter(
          (s) => s.createdAt >= where.createdAt.gte && s.requestCount > where.requestCount.gt
        ).length;
      }),
      create: vi.fn(async ({ data }: any) => {
        await tick();
        const session = { id: `session-${sessions.length + 1}`, createdAt: new Date(), ...data };
        sessions.push(session);
        return session;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const session = sessions.find((s) => s.id === where.id);
        if (session) Object.assign(session, data);
        return session;
      }),
    },
  },
}));

vi.mock('../services/placesService', () => ({
  PlacesService: { search: vi.fn() },
}));

import { createApp } from '../app';
import { PlacesService } from '../services/placesService';

const body = {
  latitude: 39.9208,
  longitude: 32.8541,
  radius: 1000,
  categories: ['cafe', 'bakery'],
};

describe('Günlük tarama limiti (POST /api/places/search)', () => {
  let server: Server;
  let baseUrl: string;

  const search = () =>
    fetch(`${baseUrl}/api/places/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  beforeAll(async () => {
    process.env.GOOGLE_MAPS_API_KEY = 'TEST_ANAHTARI';
    server = createApp().listen(0, '127.0.0.1');
    await once(server, 'listening');
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(() => {
    server.close();
    delete process.env.GOOGLE_MAPS_API_KEY;
  });

  beforeEach(() => {
    sessions.length = 0;
    vi.mocked(PlacesService.search).mockReset();
  });

  it('Aynı anda başlatılan iki taramadan yalnızca biri limiti geçmelidir', async () => {
    vi.mocked(PlacesService.search).mockImplementation(async () => {
      await tick();
      return [];
    });

    const responses = await Promise.all([search(), search()]);
    const statuses = responses.map((r) => r.status).sort();

    expect(statuses).toEqual([200, 429]);
    expect(PlacesService.search).toHaveBeenCalledTimes(1);
  });

  it('Başarısız bir gerçek tarama da günlük limitten düşülmelidir', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(PlacesService.search).mockRejectedValueOnce(new Error('Google API Hatası: 500'));

    try {
      expect((await search()).status).toBe(500);
      expect(sessions[0]).toMatchObject({ status: 'FAILED', requestCount: 2 });

      const second = await search();
      expect(second.status).toBe(429);
      expect(PlacesService.search).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }
  });
});
