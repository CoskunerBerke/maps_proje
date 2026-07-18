import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /api/statistics
router.get('/', async (req: Request, res: Response) => {
  try {
    // 1. Core counters
    const totalFound = await prisma.business.count();
    
    const noWebsiteCount = await prisma.business.count({
      where: { websiteStatus: 'no_website' },
    });
    
    const socialMediaOnlyCount = await prisma.business.count({
      where: { websiteStatus: 'social_media_only' },
    });
    
    const hasWebsiteCount = await prisma.business.count({
      where: { websiteStatus: 'has_website' },
    });

    const phoneCount = await prisma.business.count({
      where: {
        OR: [
          { nationalPhoneNumber: { not: null } },
          { internationalPhoneNumber: { not: null } },
        ],
      },
    });

    const calledCount = await prisma.business.count({
      where: {
        callingStatus: { not: 'Henüz aranmadı' },
      },
    });

    const interestedCount = await prisma.business.count({
      where: {
        callingStatus: 'İlgileniyor',
      },
    });

    const convertedCount = await prisma.business.count({
      where: {
        callingStatus: 'Müşteriye dönüştü',
      },
    });

    // 2. Kategori bazında dağılım (Only for target potential clients: no website or social media only)
    const potentialClients = await prisma.business.findMany({
      where: {
        websiteStatus: { in: ['no_website', 'social_media_only'] },
      },
      select: {
        primaryType: true,
      },
    });

    const categoryMap: { [key: string]: number } = {};
    potentialClients.forEach((client) => {
      const cat = client.primaryType || 'diğer';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const categoryDistribution = Object.keys(categoryMap).map((key) => ({
      category: key,
      count: categoryMap[key],
    }));

    // Sort by count descending
    categoryDistribution.sort((a, b) => b.count - a.count);

    res.json({
      totalFound,
      noWebsiteCount,
      socialMediaOnlyCount,
      hasWebsiteCount,
      phoneCount,
      calledCount,
      interestedCount,
      convertedCount,
      categoryDistribution,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'İstatistikler getirilirken hata oluştu: ' + error.message });
  }
});

export default router;
