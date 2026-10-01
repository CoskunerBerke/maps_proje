import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { SearchRequestSchema } from '../schemas/validation';
import { PlacesService } from '../services/placesService';
import { checkSearchLimits, createSerialQueue, startOfLocalDay } from '../utils/searchLimits';
import { sendRouteError } from '../utils/httpErrors';

const router = Router();

// The daily limit check and the session insert run under one lock; otherwise
// two searches started at the same time could both pass the limit.
const runExclusive = createSerialQueue();

// POST /api/places/search
router.post('/search', async (req: Request, res: Response) => {
  let session = null;
  try {
    const validated = SearchRequestSchema.parse(req.body);
    // Duplicate categories would only cause duplicate (billed) API requests
    validated.categories = Array.from(new Set(validated.categories));

    const reservation = await runExclusive(async () => {
      const settings = await prisma.appSettings.findUnique({ where: { id: 'global' } });

      // Check if API key is present when demo mode is disabled
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const isDemo = settings?.isDemoMode || !apiKey;

      if (!isDemo && (!apiKey || apiKey.trim() === '')) {
        return {
          status: 400,
          error: 'Google Places API anahtarı bulunamadı. server/.env dosyasına GOOGLE_MAPS_API_KEY ekleyin.',
        };
      }

      // Enforce the cost limits from the Settings page for real (billed) Google searches.
      // Every real search counts, including failed ones and ones still running.
      if (!isDemo) {
        const searchesToday = await prisma.searchSession.count({
          where: { createdAt: { gte: startOfLocalDay() }, requestCount: { gt: 0 } },
        });
        const limitError = checkSearchLimits({
          categoryCount: validated.categories.length,
          searchesToday,
          maxCategoriesPerSearch: settings?.maxCategoriesPerSearch ?? 10,
          dailyMaxSearches: settings?.dailyMaxSearches ?? 100,
        });
        if (limitError) {
          return limitError;
        }
      }

      // 1. Create a search session in DB. A real search reserves one request per
      // category up front, so it is counted even if it fails; PlacesService stores
      // the actual number when the search succeeds.
      const created = await prisma.searchSession.create({
        data: {
          latitude: validated.latitude,
          longitude: validated.longitude,
          radius: validated.radius,
          categories: JSON.stringify(validated.categories),
          totalFound: 0,
          noWebsiteCount: 0,
          requestCount: isDemo ? 0 : validated.categories.length,
          status: 'RUNNING',
        },
      });
      return { session: created };
    });

    if (!('session' in reservation)) {
      return res.status(reservation.status).json({ error: reservation.error });
    }
    session = reservation.session;

    // 2. Perform search via PlacesService
    const results = await PlacesService.search(validated, session.id);

    res.json({
      sessionId: session.id,
      results,
    });
  } catch (error: any) {
    console.error('Search endpoint error:', error);
    
    // If a session was created, update it to FAILED
    if (session) {
      try {
        await prisma.searchSession.update({
          where: { id: session.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message || 'Bilinmeyen hata',
          },
        });
      } catch (dbErr) {
        console.error('Failed to update session status to FAILED:', dbErr);
      }
    }

    sendRouteError(res, error, 'Arama sırasında bir sunucu hatası oluştu');
  }
});

export default router;
