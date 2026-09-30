import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { BusinessUpdateSchema, ExportRequestSchema } from '../schemas/validation';
import { calculateDistance } from '../utils/distance';
import { buildBusinessWhere, parseCoordinate } from '../utils/businessFilters';
import { toCsvRow } from '../utils/csv';
import { sendRouteError } from '../utils/httpErrors';
import * as XLSX from 'xlsx';
import { findEmail } from '../utils/emailFinder';
import { logToDesktop } from '../utils/desktopLogger';
import { AIWebsiteService } from '../services/aiWebsiteService';

const router = Router();

// GET /api/businesses
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status, // website status: 'no_website', 'social_media_only', 'has_website', 'all', 'all_website_less' (default)
      callingStatus, // specific CRM calling status
      crmGroup, // 'aranmamis', 'arananlar', 'olumlu', 'olumsuz', 'daha_sonra_ara'
      onlyWithPhone, // 'true' or 'false'
      search, // search query
      sortBy, // 'closest', 'furthest', 'highest_rating', 'most_reviews', 'least_reviews', 'newest'
      lat, // user latitude for distance sorting
      lng, // user longitude for distance sorting
      excludeExisting, // 'true' or 'false' (hide previously listed businesses)
    } = req.query;

    const userLat = parseCoordinate(lat);
    const userLng = parseCoordinate(lng);

    // 1. Build where clause (website status, phone, CRM status/group, text search, exclude processed)
    const where = buildBusinessWhere({ status, callingStatus, crmGroup, onlyWithPhone, search, excludeExisting });

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
    sendRouteError(res, error, 'İşletmeler getirilirken hata oluştu');
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
    sendRouteError(res, error, 'İşletme detayı getirilirken hata oluştu');
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

    // Create note if provided (nested write: status and note are saved together)
    if (validated.note && validated.note.trim() !== '') {
      updateData.notes = {
        create: { content: validated.note.trim() },
      };
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
    sendRouteError(res, error, 'İşletme güncellenirken hata oluştu');
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
    sendRouteError(res, error, 'İşletme silinirken hata oluştu');
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
    const { businessIds } = ExportRequestSchema.parse(req.body ?? {});

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
    // Cells are quoted and formula-like values (=, +, -, @) are neutralized (CSV injection)
    let csvContent = '\ufeff';
    csvContent += toCsvRow(headers) + '\n';
    rows.forEach((row) => {
      csvContent += toCsvRow(row) + '\n';
    });

    const filename = `websitesiz-isletmeler-${getFormattedDate()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    sendRouteError(res, error, 'CSV dışa aktarılırken hata oluştu');
  }
});

// POST /api/businesses/export/xlsx
router.post('/export/xlsx', async (req: Request, res: Response) => {
  try {
    const { businessIds, lat, lng } = ExportRequestSchema.parse(req.body ?? {});
    const userLat = parseCoordinate(lat);
    const userLng = parseCoordinate(lng);

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
    sendRouteError(res, error, 'Excel dışa aktarılırken hata oluştu');
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

    // 3.5 Fetch and download photos from Google Places API
    let photosArray: any[] = [];
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    
    if (business.photos) {
      try {
        photosArray = JSON.parse(business.photos);
      } catch (e) {
        console.error("Failed to parse business.photos", e);
      }
    }

    // Dynamic fallback: if no photos exist in DB, fetch them dynamically
    if ((!photosArray || photosArray.length === 0) && apiKey) {
      try {
        const detailsUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(business.id)}?fields=photos&key=${apiKey}`;
        const res = await fetch(detailsUrl);
        if (res.ok) {
          const data: any = await res.json();
          if (data.photos) {
            photosArray = data.photos;
            // Cache in DB for future generations
            await prisma.business.update({
              where: { id: business.id },
              data: { photos: JSON.stringify(data.photos) }
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch photos dynamically in route:", err);
      }
    }

    const downloadedPhotos: { filename: string; base64: string; mimeType: string }[] = [];
    if (apiKey && photosArray && photosArray.length > 0) {
      for (let i = 0; i < Math.min(photosArray.length, 4); i++) {
        const photo = photosArray[i];
        try {
          const mediaUrl = `https://places.googleapis.com/v1/${photo.name}/media?key=${apiKey}&maxWidthPx=800`;
          const mediaRes = await fetch(mediaUrl);
          if (mediaRes.ok) {
            const buffer = await mediaRes.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            downloadedPhotos.push({
              filename: `photo-${i + 1}.jpg`,
              base64: base64,
              mimeType: 'image/jpeg'
            });
          }
        } catch (e) {
          console.error(`Failed to download photo ${i} in route:`, e);
        }
      }
    }

    // 3.7 Fetch Google Maps reviews (4-5 stars only)
    let googleReviews: { authorName: string; rating: number; text: string; relativeTime?: string }[] = [];
    if (apiKey) {
      try {
        const reviewsUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(business.id)}?fields=reviews&languageCode=tr&key=${apiKey}`;
        const reviewsRes = await fetch(reviewsUrl);
        if (reviewsRes.ok) {
          const reviewsData: any = await reviewsRes.json();
          if (reviewsData.reviews && Array.isArray(reviewsData.reviews)) {
            googleReviews = reviewsData.reviews
              .filter((r: any) => r.rating >= 4 && r.text?.text && r.text.text.trim().length > 10)
              .map((r: any) => ({
                authorName: r.authorAttribution?.displayName || 'Müşteri',
                rating: r.rating,
                text: r.text?.text || '',
                relativeTime: r.relativePublishTimeDescription || undefined
              }));
          }
        }
      } catch (err) {
        console.error('Google reviews fetch failed:', err);
      }
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
      googleMapsUri: business.googleMapsUri,
      downloadedPhotos: downloadedPhotos,
      reviews: googleReviews
    });

    // 5. Deploy to Vercel
    const demoWebsiteUrl = await AIWebsiteService.deployToVercel(
      business.name,
      htmlContent,
      settings.vercelToken,
      downloadedPhotos
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
    sendRouteError(res, error, 'Otomasyon sırasında hata oluştu');
  }
});

export default router;
