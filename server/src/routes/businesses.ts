import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { BusinessUpdateSchema } from '../schemas/validation';
import { calculateDistance } from '../utils/distance';
import * as XLSX from 'xlsx';
import { findEmail } from '../utils/emailFinder';
import { logToDesktop } from '../utils/desktopLogger';
import { AIWebsiteService } from '../services/aiWebsiteService';

const router = Router();

// GET /api/businesses
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status, // website status: 'no_website', 'social_media_only', 'has_website', 'all'
      callingStatus, // specific CRM calling status
      crmGroup, // 'aranmamis', 'arananlar', 'olumlu', 'olumsuz', 'daha_sonra_ara'
      onlyWithPhone, // 'true' or 'false'
      search, // search query
      sortBy, // 'closest', 'furthest', 'highest_rating', 'most_reviews', 'least_reviews', 'newest'
      lat, // user latitude for distance sorting
      lng, // user longitude for distance sorting
      excludeExisting, // 'true' or 'false' (hide previously listed businesses)
    } = req.query;

    const userLat = lat ? parseFloat(lat as string) : null;
    const userLng = lng ? parseFloat(lng as string) : null;

    // 1. Build where clause
    const where: any = {};

    // Website status filter
    if (status && status !== 'all') {
      where.websiteStatus = status as string;
    } else if (!status) {
      // Default: show only no_website and social_media_only
      where.websiteStatus = { in: ['no_website', 'social_media_only'] };
    }

    // Phone filter
    if (onlyWithPhone === 'true') {
      where.OR = [
        { nationalPhoneNumber: { not: null } },
        { internationalPhoneNumber: { not: null } },
      ];
    }

    // CRM calling status filter
    if (callingStatus) {
      where.callingStatus = callingStatus as string;
    }

    // CRM Group filters
    if (crmGroup) {
      switch (crmGroup) {
        case 'aranmamis':
          where.callingStatus = 'Henüz aranmadı';
          break;
        case 'arananlar':
          where.callingStatus = { not: 'Henüz aranmadı' };
          break;
        case 'olumlu':
          where.callingStatus = { in: ['Müşteriye dönüştü', 'İlgileniyor', 'Teklif istiyor'] };
          break;
        case 'olumsuz':
          where.callingStatus = { in: ['Web sitesi istemiyor', 'Yanlış telefon'] };
          break;
        case 'daha_sonra_ara':
          where.callingStatus = 'Daha sonra ara';
          break;
      }
    }

    // Text search filter (name or address)
    if (search && (search as string).trim() !== '') {
      const searchStr = (search as string).trim();
      where.OR = [
        { name: { contains: searchStr } },
        { formattedAddress: { contains: searchStr } },
      ];
    }

    // Exclude previously listed businesses (already modified or has notes, or createdAt < lastSeenAt)
    if (excludeExisting === 'true') {
      // Businesses that have notes or callingStatus != 'Henüz aranmadı'
      // are considered "previously listed and processed".
      // Or simply: createdAt < lastSeenAt (which updates on subsequent searches).
      // Let's filter out ones where callingStatus is not 'Henüz aranmadı' OR they have notes.
      where.callingStatus = 'Henüz aranmadı';
      where.notes = { none: {} };
    }

    // 2. Fetch businesses from DB
    const businesses = await prisma.business.findMany({
      where,
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // 3. Process distances
    let results = businesses.map((b) => {
      let distance = 0;
      if (userLat !== null && userLng !== null) {
        distance = calculateDistance(userLat, userLng, b.latitude, b.longitude);
      }
      return {
        ...b,
        types: JSON.parse(b.types),
        distance,
      };
    });

    // 4. Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case 'closest':
          results.sort((a, b) => a.distance - b.distance);
          break;
        case 'furthest':
          results.sort((a, b) => b.distance - a.distance);
          break;
        case 'highest_rating':
          results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'most_reviews':
          results.sort((a, b) => (b.userRatingCount || 0) - (a.userRatingCount || 0));
          break;
        case 'least_reviews':
          results.sort((a, b) => (a.userRatingCount || 0) - (b.userRatingCount || 0));
          break;
        case 'newest':
          results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          break;
      }
    } else {
      // Default: sort by closest if coords present, else newest
      if (userLat !== null && userLng !== null) {
        results.sort((a, b) => a.distance - b.distance);
      } else {
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
    }

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: 'İşletmeler getirilirken hata oluştu: ' + error.message });
  }
});

// GET /api/businesses/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!business) {
      return res.status(404).json({ error: 'İşletme bulunamadı.' });
    }

    res.json({
      ...business,
      types: JSON.parse(business.types),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'İşletme detayı getirilirken hata oluştu: ' + error.message });
  }
});

// PATCH /api/businesses/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = BusinessUpdateSchema.parse(req.body);

    const updateData: any = {};
    if (validated.callingStatus) {
      updateData.callingStatus = validated.callingStatus;
    }

    // Create note if provided
    if (validated.note && validated.note.trim() !== '') {
      await prisma.businessNote.create({
        data: {
          businessId: id,
          content: validated.note.trim(),
        },
      });
    }

    const business = await prisma.business.update({
      where: { id },
      data: updateData,
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json({
      ...business,
      types: JSON.parse(business.types),
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Geçersiz parametreler', details: error.errors });
    } else {
      res.status(500).json({ error: 'İşletme güncellenirken hata oluştu: ' + error.message });
    }
  }
});

// DELETE /api/businesses/:id (Listeden çıkar)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.business.delete({
      where: { id },
    });
    res.json({ message: 'İşletme listeden başarıyla çıkarıldı.' });
  } catch (error: any) {
    res.status(500).json({ error: 'İşletme silinirken hata oluştu: ' + error.message });
  }
});

// Helper: Format date for Excel/CSV filename
function getFormattedDate(): string {
  const date = new Date();
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const DD = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${YYYY}-${MM}-${DD}-${HH}-${mm}`;
}

// POST /api/businesses/export/csv
router.post('/export/csv', async (req: Request, res: Response) => {
  try {
    const { businessIds } = req.body;
    
    const businesses = await prisma.business.findMany({
      where: businessIds ? { id: { in: businessIds } } : {},
      include: {
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });

    // Generate CSV contents
    // Columns: İşletme Adı, Kategori, Telefon, Adres, Puan, Yorum Sayısı, Web Sitesi, Web Sitesi Durumu, Google Maps Linki, Arama Durumu, Notlar, Bulunma Tarihi
    const headers = [
      'İşletme Adı',
      'Kategori',
      'Telefon',
      'Adres',
      'Puan',
      'Yorum Sayısı',
      'Web Sitesi',
      'Web Sitesi Durumu',
      'Google Maps Linki',
      'Arama Durumu',
      'Notlar',
      'Bulunma Tarihi',
    ];

    const rows = businesses.map((b) => {
      const primaryCategory = b.primaryType || 'Bilinmiyor';
      const phone = b.nationalPhoneNumber || b.internationalPhoneNumber || '';
      const notesStr = b.notes.map((n) => `[${n.createdAt.toLocaleDateString('tr-TR')}] ${n.content}`).join(' | ');
      
      const websiteStatusText = 
        b.websiteStatus === 'no_website' ? 'Web sitesi yok' :
        b.websiteStatus === 'social_media_only' ? 'Yalnızca sosyal medya hesabı var' :
        b.websiteStatus === 'has_website' ? 'Web sitesi var' : 'Kontrol edilemedi';

      return [
        b.name,
        primaryCategory,
        phone,
        b.formattedAddress || '',
        b.rating ? String(b.rating) : '0',
        b.userRatingCount ? String(b.userRatingCount) : '0',
        b.websiteUri || '',
        websiteStatusText,
        b.googleMapsUri || '',
        b.callingStatus,
        notesStr,
        b.createdAt.toLocaleDateString('tr-TR'),
      ];
    });

    // Build CSV String with UTF-8 BOM (\ufeff) to prevent Turkish character issues in Excel
    let csvContent = '\ufeff';
    csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';
    rows.forEach((row) => {
      csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const filename = `websitesiz-isletmeler-${getFormattedDate()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    res.status(500).json({ error: 'CSV dışa aktarılırken hata oluştu: ' + error.message });
  }
});

// POST /api/businesses/export/xlsx
router.post('/export/xlsx', async (req: Request, res: Response) => {
  try {
    const { businessIds, lat, lng } = req.body;
    const userLat = lat ? parseFloat(lat as string) : null;
    const userLng = lng ? parseFloat(lng as string) : null;

    const businesses = await prisma.business.findMany({
      where: businessIds ? { id: { in: businessIds } } : {},
      include: {
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });

    // Excel row structure
    const data = businesses.map((b) => {
      const primaryCategory = b.primaryType || 'Bilinmiyor';
      const phone = b.nationalPhoneNumber || b.internationalPhoneNumber || '';
      
      const websiteStatusText = 
        b.websiteStatus === 'no_website' ? 'Web sitesi yok' :
        b.websiteStatus === 'social_media_only' ? 'Yalnızca sosyal medya hesabı var' :
        b.websiteStatus === 'has_website' ? 'Web sitesi var' : 'Kontrol edilemedi';

      const notesStr = b.notes.map((n) => n.content).join(' | ');

      let distanceText = 'Bilinmiyor';
      if (userLat !== null && userLng !== null) {
        const dist = calculateDistance(userLat, userLng, b.latitude, b.longitude);
        distanceText = dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km`;
      }

      return {
        'İşletme Adı': b.name,
        'Kategori': primaryCategory,
        'Mesafe': distanceText,
        'Telefon': phone,
        'Adres': b.formattedAddress || '',
        'Puan': b.rating || 0,
        'Yorum Sayısı': b.userRatingCount || 0,
        'Web Sitesi': b.websiteUri || '',
        'Web Sitesi Durumu': websiteStatusText,
        'Google Maps Linki': b.googleMapsUri || '',
        'Arama Durumu': b.callingStatus,
        'Not': notesStr,
        'Bulunma Tarihi': b.createdAt.toLocaleDateString('tr-TR'),
        'Son Aranma Tarihi': b.notes.length > 0 ? b.notes[0].createdAt.toLocaleDateString('tr-TR') : '',
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Style elements (supported in SheetJS Community):
    // 1. Autofilter
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

    // 2. Frozen rows (first row frozen)
    ws['!views'] = [
      { state: 'frozen', ySplit: 1, xSplit: 0, activePane: 'bottomLeft', topLeftCell: 'A2' },
    ];

    // 3. Column widths auto-fit
    const columns = [
      'İşletme Adı', 'Kategori', 'Mesafe', 'Telefon', 'Adres', 'Puan', 'Yorum Sayısı', 
      'Web Sitesi', 'Web Sitesi Durumu', 'Google Maps Linki', 'Arama Durumu', 'Not', 
      'Bulunma Tarihi', 'Son Aranma Tarihi'
    ];
    
    ws['!cols'] = columns.map((colName) => {
      let maxLen = colName.length;
      data.forEach((row: any) => {
        const val = String(row[colName] || '');
        if (val.length > maxLen) {
          maxLen = val.length;
        }
      });
      return { wch: Math.min(Math.max(maxLen + 3, 10), 40) }; // limit to 40 characters width max, min 10
    });

    XLSX.utils.book_append_sheet(wb, ws, 'İşletmeler');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `websitesiz-isletmeler-${getFormattedDate()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(buffer);
  } catch (error: any) {
    res.status(500).json({ error: 'Excel dışa aktarılırken hata oluştu: ' + error.message });
  }
});

// POST /api/businesses/:id/generate-site
router.post('/:id/generate-site', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Find business in DB
    const business = await prisma.business.findUnique({
      where: { id },
      include: { notes: { orderBy: { createdAt: 'desc' } } }
    });

    if (!business) {
      return res.status(404).json({ error: 'İşletme bulunamadı.' });
    }

    // 2. Fetch global settings to get API tokens
    const settings = await prisma.appSettings.findUnique({
      where: { id: 'global' }
    });

    if (!settings || !settings.geminiApiKey || !settings.vercelToken) {
      return res.status(400).json({
        error: 'Lütfen Ayarlar sayfasından Gemini API Key ve Vercel Token alanlarını doldurun.'
      });
    }

    // 3. Search and extract email if not already found
    let email = business.email;
    if (!email || email === 'Bulunamadı') {
      const addressParts = business.formattedAddress ? business.formattedAddress.split(' ') : [];
      const city = addressParts[addressParts.length - 1] || 'Turkey';
      
      email = await findEmail(business.name, city);
    }

    // 4. Generate HTML code via Gemini
    const category = business.primaryType || 'store';
    const htmlContent = await AIWebsiteService.generateHtml({
      businessName: business.name,
      category: category,
      address: business.formattedAddress || 'Adres bilgisi yok',
      phone: business.nationalPhoneNumber || business.internationalPhoneNumber,
      rating: business.rating,
      reviewsCount: business.userRatingCount,
      geminiApiKey: settings.geminiApiKey,
      vercelToken: settings.vercelToken,
      googleMapsUri: business.googleMapsUri
    });

    // 5. Deploy to Vercel
    const demoWebsiteUrl = await AIWebsiteService.deployToVercel(
      business.name,
      htmlContent,
      settings.vercelToken
    );

    // 6. Log and save to Desktop
    logToDesktop({
      name: business.name,
      phone: business.nationalPhoneNumber || business.internationalPhoneNumber,
      email: email,
      demoWebsiteUrl: demoWebsiteUrl
    });

    // 7. Update business in DB (plus add a note about this automated deployment)
    const updatedBusiness = await prisma.business.update({
      where: { id },
      data: {
        email,
        demoWebsiteUrl,
        notes: {
          create: {
            content: `Otomatik yapay zeka web sitesi üretildi ve Vercel'e yüklendi: ${demoWebsiteUrl}. Masaüstündeki "potansiyel-musteriler.txt" dosyasına kaydedildi.`
          }
        }
      },
      include: {
        notes: { orderBy: { createdAt: 'desc' } }
      }
    });

    res.json({
      ...updatedBusiness,
      types: JSON.parse(updatedBusiness.types)
    });
  } catch (error: any) {
    console.error('Website generation automation failed:', error);
    res.status(500).json({ error: 'Otomasyon sırasında hata oluştu: ' + error.message });
  }
});

export default router;
