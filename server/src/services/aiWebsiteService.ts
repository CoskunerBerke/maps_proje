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
  - Sitede bol miktarda yüksek kaliteli ve gerçekçi fotoğraflar kullanın. Bunun için **Unsplash** üzerindeki gerçek fotoğraf linklerini ("https://images.unsplash.com/" ile başlayan, örn: yemek, salon, iç mekan vb. temsil eden gerçek görsel adresleri) tercih edin.
  - **Hero Bölümü:** İşletmenin türüne uygun (örneğin restoran için lezzetli bir yemek tabağı, kuaför için modern bir salon, oto servis için parlayan bir araç) geniş bir arka plan veya yan görsel barındırmalıdır.
  - **Hizmetler / Ürünler Kartları:** Her kartın üst kısmında o hizmeti simgeleyen (örneğin saç kesim kartında saç kesen kuaför görseli, kahve kartında sıcak latte) kaliteli bir görsel olmalıdır.
  - **Hakkımızda Bölümü:** Güven veren bir ekip, işletme dış cephesi veya üretim anını gösteren bir görsel ile yan yana yer almalıdır.
  - Görsellerin tümüne Tailwind'in "object-cover" sınıfını verin, hafif zoom/hover animasyonları ("hover:scale-105 transition-transform duration-300") ve yuvarlatılmış köşeler kullanarak sitenin canlı, premium ve interaktif hissettirmesini sağlayın.
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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
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
   * Deploys the index.html content to Vercel dynamically.
   * Creates a project name based on the business name.
   */
  static async deployToVercel(
    projectName: string,
    htmlContent: string,
    vercelToken: string
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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vercelToken}`,
      },
      body: JSON.stringify({
        name: uniqueSlug,
        files: [
          {
            file: 'index.html',
            data: htmlContent,
          },
        ],
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

    return `https://${data.url}`;
  }
}
