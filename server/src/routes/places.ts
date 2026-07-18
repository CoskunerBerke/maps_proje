import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { SearchRequestSchema } from '../schemas/validation';
import { PlacesService } from '../services/placesService';

const router = Router();

// POST /api/places/search
router.post('/search', async (req: Request, res: Response) => {
  let session = null;
  try {
    const validated = SearchRequestSchema.parse(req.body);

    const settings = await prisma.appSettings.findUnique({ where: { id: 'global' } });
    
    // Check if API key is present when demo mode is disabled
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const isDemo = settings?.isDemoMode || !apiKey;

    if (!isDemo && (!apiKey || apiKey.trim() === '')) {
      return res.status(400).json({
        error: 'Google Places API anahtarı bulunamadı. server/.env dosyasına GOOGLE_MAPS_API_KEY ekleyin.'
      });
    }

    // 1. Create a search session in DB
    session = await prisma.searchSession.create({
      data: {
        latitude: validated.latitude,
        longitude: validated.longitude,
        radius: validated.radius,
        categories: JSON.stringify(validated.categories),
        totalFound: 0,
        noWebsiteCount: 0,
        requestCount: 0,
        status: 'RUNNING',
      },
    });

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

    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Geçersiz parametreler', details: error.errors });
    } else {
      res.status(500).json({ error: error.message || 'Arama sırasında bir sunucu hatası oluştu.' });
    }
  }
});

export default router;
