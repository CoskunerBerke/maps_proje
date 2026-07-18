import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { SettingsUpdateSchema } from '../schemas/validation';

const router = Router();

// GET /api/settings
router.get('/', async (req: Request, res: Response) => {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: 'global' },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: 'global',
          dailyMaxSearches: 100,
          maxCategoriesPerSearch: 10,
          maxBusinessesPerSearch: 100,
          isDemoMode: false,
          geminiApiKey: null,
          vercelToken: null,
        },
      });
    }

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: 'Ayarlar getirilirken hata oluştu: ' + error.message });
  }
});

// PATCH /api/settings
router.patch('/', async (req: Request, res: Response) => {
  try {
    const validated = SettingsUpdateSchema.parse(req.body);

    const settings = await prisma.appSettings.upsert({
      where: { id: 'global' },
      update: validated,
      create: {
        id: 'global',
        dailyMaxSearches: validated.dailyMaxSearches ?? 100,
        maxCategoriesPerSearch: validated.maxCategoriesPerSearch ?? 10,
        maxBusinessesPerSearch: validated.maxBusinessesPerSearch ?? 100,
        isDemoMode: validated.isDemoMode ?? false,
        geminiApiKey: validated.geminiApiKey ?? null,
        vercelToken: validated.vercelToken ?? null,
      },
    });

    res.json(settings);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Geçersiz parametreler', details: error.errors });
    } else {
      res.status(500).json({ error: 'Ayarlar güncellenirken hata oluştu: ' + error.message });
    }
  }
});

export default router;
