/**
 * Optional demo data: fills the CRM with clearly fictional sample leads
 * ("Örnek ..." businesses, invalid 0312 000 .. phone numbers, example.com
 * websites) so the UI can be tried and screenshotted without a Google API key.
 *
 * Usage: npm run prisma:seed-demo   (safe to run again; only touches demo_showcase_* rows)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Around Kızılay, Ankara
const CENTER = { latitude: 39.9208, longitude: 32.8541 };

interface DemoLead {
  name: string;
  type: string;
  websiteUri: string | null;
  websiteStatus: 'no_website' | 'social_media_only' | 'has_website';
  rating: number;
  reviews: number;
  offset: [number, number]; // lat/lng offset from CENTER
  callingStatus: string;
  notes?: string[];
  hasPhone?: boolean;
}

const LEADS: DemoLead[] = [
  { name: 'Örnek Kahve Evi', type: 'cafe', websiteUri: null, websiteStatus: 'no_website', rating: 4.7, reviews: 214, offset: [0.0021, 0.0012], callingStatus: 'İlgileniyor', notes: ['Sahibi hafta içi 14:00 sonrası müsait.', 'Menü fotoğrafları istendi, demo site için hazırlanacak.'] },
  { name: 'Örnek Berber Salonu', type: 'barber_shop', websiteUri: 'https://instagram.com/ornek-berber-demo', websiteStatus: 'social_media_only', rating: 4.9, reviews: 132, offset: [-0.0034, 0.0041], callingStatus: 'Teklif istiyor', notes: ['Online randevu özelliği istiyor.'] },
  { name: 'Örnek Pide Salonu', type: 'restaurant', websiteUri: null, websiteStatus: 'no_website', rating: 4.3, reviews: 389, offset: [0.0052, -0.0027], callingStatus: 'Henüz aranmadı' },
  { name: 'Örnek Güzellik Stüdyosu', type: 'beauty_salon', websiteUri: 'https://facebook.com/ornek-guzellik-demo', websiteStatus: 'social_media_only', rating: 4.8, reviews: 76, offset: [-0.0061, -0.0018], callingStatus: 'Mesaj atıldı', notes: ['WhatsApp üzerinden bilgi gönderildi.'] },
  { name: 'Örnek Fırın & Pastane', type: 'bakery', websiteUri: null, websiteStatus: 'no_website', rating: 4.6, reviews: 158, offset: [0.0088, 0.0063], callingStatus: 'Daha sonra ara', notes: ['Cuma günü tekrar aranacak.'] },
  { name: 'Örnek Terzi Atölyesi', type: 'clothing_store', websiteUri: null, websiteStatus: 'no_website', rating: 4.9, reviews: 41, offset: [-0.0012, 0.0094], callingStatus: 'Arandı, ulaşılmadı', notes: ['Telefon açılmadı.'] },
  { name: 'Örnek Nail Bar', type: 'nail_salon', websiteUri: 'https://instagram.com/ornek-nail-demo', websiteStatus: 'social_media_only', rating: 4.5, reviews: 63, offset: [0.0107, -0.0081], callingStatus: 'Henüz aranmadı', hasPhone: false },
  { name: 'Örnek Tatlı Dükkanı', type: 'dessert_shop', websiteUri: null, websiteStatus: 'no_website', rating: 4.4, reviews: 97, offset: [-0.0093, 0.0035], callingStatus: 'Müşteriye dönüştü', notes: ['Tek sayfalık site teklifi kabul edildi.', 'Alan adı seçimi bekleniyor.'] },
  { name: 'Örnek Kuaför', type: 'hair_salon', websiteUri: null, websiteStatus: 'no_website', rating: 4.2, reviews: 55, offset: [0.0036, 0.0118], callingStatus: 'Henüz aranmadı' },
  { name: 'Örnek Ayakkabı Tamir', type: 'shoe_store', websiteUri: null, websiteStatus: 'no_website', rating: 4.8, reviews: 28, offset: [-0.0128, -0.0064], callingStatus: 'Web sitesi istemiyor', notes: ['Şu an ihtiyaç duymuyor.'] },
  { name: 'Örnek Kuyumcu', type: 'jewelry_store', websiteUri: 'https://example.com', websiteStatus: 'has_website', rating: 4.6, reviews: 112, offset: [0.0063, -0.0105], callingStatus: 'Henüz aranmadı' },
  { name: 'Örnek Lokanta', type: 'restaurant', websiteUri: 'https://example.org', websiteStatus: 'has_website', rating: 4.1, reviews: 402, offset: [-0.0042, -0.0122], callingStatus: 'Henüz aranmadı' },
];

async function main() {
  console.log('Adding fictional demo leads...');

  const session = await prisma.searchSession.upsert({
    where: { id: 'demo_showcase_session' },
    update: {},
    create: {
      id: 'demo_showcase_session',
      latitude: CENTER.latitude,
      longitude: CENTER.longitude,
      radius: 3000,
      categories: JSON.stringify(Array.from(new Set(LEADS.map((l) => l.type)))),
      totalFound: LEADS.length,
      noWebsiteCount: LEADS.filter((l) => l.websiteStatus !== 'has_website').length,
      requestCount: 0,
      status: 'SUCCESS',
    },
  });

  for (const [index, lead] of LEADS.entries()) {
    const id = `demo_showcase_${index + 1}`;
    const suffix = String(index + 1).padStart(2, '0');
    // 0312 000 00 xx is not a valid Turkish subscriber number (fictional on purpose)
    const hasPhone = lead.hasPhone !== false;
    const data = {
      name: lead.name,
      primaryType: lead.type,
      types: JSON.stringify([lead.type, 'point_of_interest', 'establishment']),
      formattedAddress: `Örnek Mah. Deneme Sk. No:${index + 1}, Çankaya/Ankara`,
      latitude: CENTER.latitude + lead.offset[0],
      longitude: CENTER.longitude + lead.offset[1],
      rating: lead.rating,
      userRatingCount: lead.reviews,
      websiteUri: lead.websiteUri,
      websiteStatus: lead.websiteStatus,
      nationalPhoneNumber: hasPhone ? `0312 000 00 ${suffix}` : null,
      internationalPhoneNumber: hasPhone ? `+90 312 000 00 ${suffix}` : null,
      googleMapsUri: null,
      businessStatus: 'OPERATIONAL',
      isOpen: true,
      callingStatus: lead.callingStatus,
      searchSessionId: session.id,
    };

    await prisma.business.upsert({ where: { id }, update: data, create: { id, ...data } });

    // Recreate the demo notes so repeated runs do not duplicate them
    await prisma.businessNote.deleteMany({ where: { businessId: id } });
    for (const content of lead.notes || []) {
      await prisma.businessNote.create({ data: { businessId: id, content } });
    }
  }

  console.log(`Demo data ready: ${LEADS.length} fictional businesses.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
