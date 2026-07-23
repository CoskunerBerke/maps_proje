interface WebGenerationParams {
  businessName: string;
  category: string;
  address: string;
  phone: string | null;
  rating: number | null;
  reviewsCount: number | null;
  geminiApiKey: string;
  vercelToken: string;
  googleMapsUri: string | null;
  downloadedPhotos: { filename: string; base64: string; mimeType: string }[];
}

export class AIWebsiteService {
  /**
   * Generates a single-page modern landing page HTML string using Gemini API (2.5-flash)
   */
  static async generateHtml(params: WebGenerationParams): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${params.geminiApiKey}`;

    const mapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(params.businessName + ' ' + params.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    const mapsTargetUrl = params.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(params.businessName + ' ' + params.address)}`;

    const prompt = `
Generate a beautiful, premium, fully functional single-page HTML website for a local business with the following details:
- Business Name: ${params.businessName}
- Category: ${params.category}
- Address: ${params.address}
- Phone: ${params.phone || 'Not available'}
- Rating: ${params.rating || 'No ratings'} (${params.reviewsCount || 0} reviews)

Design Requirements:
- Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Use Google Fonts (e.g. Inter or Outfit) for modern typography.
- Use Lucide Icons or FontAwesome CDN for clean icons.
- Add a beautiful dark/light modern premium color scheme matching the industry (e.g., warm golden/slate tones for cafes, luxury rose/gold for beauty salons, clean corporate blue/gray for retail).
- **Görseller ve Fotoğraflar (KRİTİK):**
  - Kesinlikle boş gri kutular veya yer tutucu (placeholder) çizimler kullanmayın.
  - Size bu işletmeye ait Google Haritalar'dan çekilen ${params.downloadedPhotos.length} adet fotoğraf gönderilmiştir. 
  - Lütfen bu fotoğrafları multimodal olarak tek tek analiz edin:
    1. Eğer fotoğrafta belirgin bir şekilde yakın çekim insan yüzleri, personel veya müşteri kalabalıkları var ise, o fotoğrafı web sitesinde KULLANMAYIN (yani "./photo-N.jpg" dosya yolunu src olarak atamayın).
    2. Eğer fotoğrafta mekanın içi, dışı, ürünleri (örn: yemek tabağı, kahve fincanı, dükkan tezgahı, araçlar vb.) veya genel konsepti insansız (veya arka planda belirsiz insanlar olacak şekilde) görünüyorsa, o görseli "./photo-1.jpg", "./photo-2.jpg" gibi dosya isimleriyle (birinci fotoğraf için "./photo-1.jpg", ikincisi için "./photo-2.jpg" vb.) sitedeki ilgili yerlere (Hero, Hizmet Kartları, Hakkımızda vb.) yerleştirin.
  - Eğer gönderilen fotoğrafların tamamında insan var ise veya hiç fotoğraf gönderilmemişse, aşağıdaki konseptlerden işletmeye uygun olanı için gerçekçi, yüksek kaliteli Unsplash fotoğraf linklerini kullanın (URL'yi birebir yazın, hayali link uydurmayın):
    * Kahveci / Cafe / Fırın: 
      - Banner: https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=1200&auto=format&fit=crop
      - Hizmetler: https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop
      - Hakkımızda: https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=800&auto=format&fit=crop
    * Güzellik Salonu / Kuaför / Spa:
      - Banner: https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop
      - Hizmetler: https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=600&auto=format&fit=crop
      - Hakkımızda: https://images.unsplash.com/photo-1527891751199-7225231a68dd?q=80&w=800&auto=format&fit=crop
    * Restoran / Yemek:
      - Banner: https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop
      - Hizmetler: https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=600&auto=format&fit=crop
      - Hakkımızda: https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop
    * Oto Servis / Yıkama:
      - Banner: https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=1200&auto=format&fit=crop
      - Hizmetler: https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=600&auto=format&fit=crop
      - Hakkımızda: https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?q=80&w=800&auto=format&fit=crop
    * Genel Perakende Dükkan / Diğer:
      - Banner: https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop
      - Hizmetler: https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?q=80&w=600&auto=format&fit=crop
      - Hakkımızda: https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop
  - Görsellerin tümüne Tailwind'in "object-cover" sınıfını verin, hafif zoom/hover animasyonları ("hover:scale-105 transition-transform duration-300") ve yuvarlatılmış köşeler kullanarak sitenin canlı, premium ve son derece profesyonel hissettirmesini sağlayın.
- **Konum & Harita Entegrasyonu (KRİTİK):**
  - Sayfadaki harita iframe'i için kesinlikle şu URL'yi kullanın (iframe'in src özelliğine birebir yerleştirin): "${mapsEmbedUrl}"
  - "Haritalar'da Aç" butonu veya harita linkleri için kesinlikle şu yönlendirme URL'sini kullanın (href özelliğine birebir yerleştirin): "${mapsTargetUrl}"
  - Bu sayede kullanıcının tıkladığı buton doğrudan doğru adrese gidecek ve harita doğru yeri gösterecektir.
- **Hizalamalar & Düzen (KRİTİK):**
  - Müşteri yorumları/puan bloğu (örneğin ${params.rating || 4.5} puanlık kısım) dahil tüm istatistiksel ve puan kartları kendi içinde **tam olarak yatay ve dikey olarak ortalanmalıdır**.
  - Tailwind sınıflarını (örneğin "flex flex-col items-center justify-center text-center mx-auto") kullanarak hiçbir yazının veya ikonun sola/sağa kaymamasını garanti altına edin.
- Sections to include:
  1. Header/Navigation (Logo, Links, "Hemen Ara" CTA button)
  2. Hero Section (Catchy headline, short description, Call to action buttons)
  3. Services / Products section (grid layout with 3-4 cards containing price points, titles, descriptions)
  4. About Section (History of the business, focus on quality)
  5. Reviews/Social proof section (Showcasing their rating of ${params.rating || 4.5}/5 on Google Maps)
  6. Contact section (Embedded map placeholder, address details, interactive contact form)
  7. Footer (Links, Copyright, phone number link)
- Ensure all copy is in **Turkish** since the business is based in Turkey.
- Make the code completely self-contained in a single HTML file.
- The output MUST be ONLY the raw HTML code. Do not wrap it in markdown code blocks (no \`\`\`html or other annotations). Return just the raw index.html code.
`;

    const parts: any[] = [
      {
        text: prompt,
      },
    ];

    if (params.downloadedPhotos && params.downloadedPhotos.length > 0) {
      params.downloadedPhotos.forEach((photo) => {
        parts.push({
          inlineData: {
            mimeType: photo.mimeType,
            data: photo.base64,
          },
        });
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: parts,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Hatası: ${response.status} - ${errText}`);
    }

    const resData: any = await response.json();
    let htmlContent = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!htmlContent) {
      throw new Error('Gemini API boş bir kod üretti.');
    }

    // Sanitize in case Gemini still wrapped in code blocks
    htmlContent = htmlContent.trim();
    if (htmlContent.startsWith('```html')) {
      htmlContent = htmlContent.substring(7);
    } else if (htmlContent.startsWith('```')) {
      htmlContent = htmlContent.substring(3);
    }
    if (htmlContent.endsWith('```')) {
      htmlContent = htmlContent.substring(0, htmlContent.length - 3);
    }
    htmlContent = htmlContent.trim();

    return htmlContent;
  }

  /**
   * Deploys the index.html content to Vercel dynamically along with downloaded photos.
   * Creates a project name based on the business name.
   */
  static async deployToVercel(
    projectName: string,
    htmlContent: string,
    vercelToken: string,
    downloadedPhotos: { filename: string; base64: string; mimeType: string }[] = []
  ): Promise<string> {
    const url = 'https://api.vercel.com/v13/deployments';

    // Sanitize project name slug for Vercel (lowercase, alphanumeric and hyphens only)
    const projectSlug = projectName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'eksikweb-demosite';
      
    const uniqueSlug = `${projectSlug}-${Math.random().toString(36).substring(2, 7)}`;

    const filesToDeploy = [
      {
        file: 'index.html',
        data: htmlContent,
      },
    ];

    downloadedPhotos.forEach((photo) => {
      filesToDeploy.push({
        file: photo.filename,
        data: photo.base64,
        encoding: 'base64',
      } as any);
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vercelToken}`,
      },
      body: JSON.stringify({
        name: uniqueSlug,
        files: filesToDeploy,
        projectSettings: {
          framework: null,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Vercel API Hatası: ${response.status} - ${errText}`);
    }

    const data: any = await response.json();
    if (!data.url) {
      throw new Error('Vercel deployment adresi döndürmedi.');
    }

    // Return the clean project-level production alias domain instead of the long preview URL
    return `https://${uniqueSlug}.vercel.app`;
  }
}
