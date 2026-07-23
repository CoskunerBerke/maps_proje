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
    * Erkek Kuaförü / Berber / Barber Shop (KRİTİK: KESİNLİKLE kadın saç modeli, oje, makyaj, doktor/medikal/hemşire görselleri KULLANMAYIN!):
      - Banner (Ana Sayfa Görseli): https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop (Lüks berber koltukları ve salon tasarımı)
      - Saç Kesimi Görseli: https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=600&auto=format&fit=crop (Erkek saç kesimi ve şekillendirme)
      - Sakal Bakımı Görseli: https://images.unsplash.com/photo-1593702295094-aec22dfad693?q=80&w=600&auto=format&fit=crop (Erkek sakal tıraşı)
      - Yıkama ve Cilt Bakımı Görseli: https://images.unsplash.com/photo-1605497746444-ac9dbd39f477?q=80&w=600&auto=format&fit=crop (Tarak, makas ve sakal bakım yağları)
      - Hakkımızda Görseli: https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop (Geleneksel berber koltuğu ve makaslar)
    * Bayan Kuaförü / Güzellik Salonu / Spa / Manikür (KRİTİK: Erkek berberi için bunu KULLANMAYIN!):
      - Banner: https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop
      - Hizmetler: https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=600&auto=format&fit=crop
      - Hakkımızda: https://images.unsplash.com/photo-1527891751199-7225231a68dd?q=80&w=800&auto=format&fit=crop
    * Kahveci / Cafe / Fırın: 
      - Banner: https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=1200&auto=format&fit=crop
      - Hizmetler: https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop
      - Hakkımızda: https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=800&auto=format&fit=crop
    * Restoran / Yemek / Kebap / Fast Food:
      - Banner: https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop
      - Hizmetler: https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=600&auto=format&fit=crop
      - Hakkımızda: https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop
    * Oto Servis / Yıkama / Aksesuar:
      - Banner: https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=1200&auto=format&fit=crop
      - Hizmetler: https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=600&auto=format&fit=crop
      - Hakkımızda: https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?q=80&w=800&auto=format&fit=crop
    * Genel Perakende Dükkan / Diğer:
      - Banner: https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop
      - Hizmetler: https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600&auto=format&fit=crop, https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?q=80&w=600&auto=format&fit=crop
      - Hakkımızda: https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop
  - Görsellerin tümüne Tailwind'in "object-cover" sınıfını verin, hafif zoom/hover animasyonları ("hover:scale-105 transition-transform duration-300") ve yuvarlatılmış köşeler kullanarak sitenin canlı, premium ve son derece profesyonel hissettirmesini sağlayın.
- **Tasarım Şıklığı & Premium Görünüm Kuralları (KRİTİK - SADE YAPMAYIN):**
  * Sitede düz gri arka planlar ve basit beyaz kutulardan oluşan ucuz/sade tasarımlar kesinlikle YAPMAYIN.
  * Arka planlarda düz renkler yerine şık CSS degrade (gradient) geçişleri (örneğin dark temalarda: to-slate-900 via-zinc-950 from-neutral-950), ince modern desenler veya dairesel parlamalar (radial blur glow) tercih edin.
  * Kartları tasarlarken "Glassmorphism" (cam efekti) uygulayın: 'backdrop-blur-md bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 shadow-2xl' ve hover edildiğinde kenarlarında hafif bir parlama (glow) veya shadow efekti olmasını sağlayın.
  * Butonları 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] px-6 py-3 rounded-xl' gibi son derece parlayan ve dinamik sınıflarla süsleyin.
  * Metin başlıklarını çok daha estetik yapmak için degrade geçişli yazılar ('bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent') tercih edin.
  * Hizmet kartlarının üstündeki resimleri hover edildiğinde büyüyecek şekilde ('overflow-hidden' bir kapsayıcı içinde 'hover:scale-105 transition-transform duration-500') kurgulayın.
- **Hareketli & İnteraktif Öğeler (KRİTİK - SİTEYİ CANLI VE EĞLENCELİ YAPIN):**
  * Sitede animasyonlar ve interaktif öğeler bolca yer almalı, kullanıcı sayfayı kaydırdıkça site yaşamalıdır.
  * **Kaydırma Animasyonları (Scroll Effects):** Sayfa öğelerine (kartlar, başlıklar vb.) modern CSS animasyonları uygulayın. Örneğin, hover edildiğinde yukarı doğru hafifçe süzülen kartlar ('hover:-translate-y-2 transition-all duration-500 ease-out').
  * **İnteraktif JavaScript Öğeleri (MUTLAKA EKLEYİN):**
    1. **Sayaç Animasyonu (Count-Up):** Sayfa yüklendiğinde Google Maps puanını (örneğin 0'dan 4.9'a) ve mutlu müşteri sayısını (örneğin 0'dan 1500+'e) sıfırdan yukarı doğru sayan şık bir JavaScript animasyonlu istatistik bloğu kurun.
    2. **Fiyat Hesaplama veya Hizmet Seçim Paneli (Book/Service Selector):** Hizmetler veya Paketler bölümüne tıklanabilir küçük kutucuklar ekleyin. Kullanıcı hizmetleri seçtikçe sağ tarafta veya altta "Toplam Tahmini Tutar"ı dinamik olarak hesaplayan ve gösteren interaktif bir JavaScript hesaplayıcı yapın!
    3. **Yorum Slider'ı (Testimonials Carousel):** Müşteri yorumlarını tek bir alanda gösterip sağ/sol oklarla veya otomatik geçişle (carousel) dönmesini sağlayan basit ve şık bir JavaScript slider yapın.
    4. **Soru-Cevap Sıkça Sorulan Sorular (FAQ Accordion):** Soruların üzerine tıklandığında cevapların aşağı doğru akıcı bir şekilde açılıp kapandığı (accordion) bir bölüm oluşturun.
    5. **Karanlık / Aydınlık Mod (Theme Toggle):** Sayfanın sağ üst köşesine tıklanıldığında tüm sitenin temasını değiştiren şık bir JavaScript buton/geçiş anahtarı ekleyin.
- **Arama Motoru Optimizasyonu (SEO) & Google Dostu Yapı (KRİTİK):**
  - Sitede Google arama motorunun sevdiği ve üst sıralara çıkaran anahtar kelime zenginliğine dikkat edin.
  - Sektör ve konuma göre (örneğin işletmenin adresindeki il/ilçe bilgisinden yola çıkarak, örn: "Ankara'nın En İyi Cafe ve Filtre Kahvecisi", "Kadıköy'de Profesyonel Saç Tasarım ve Güzellik Salonu") başlıklar (h1, h2) ve metinler oluşturun.
  - Sayfa başlığını (<title>) işletme adı, kategorisi ve şehri içerecek şekilde arama odaklı yapın.
  - Sayfa için açıklayıcı bir <meta name="description" content="..."> meta etiketi ekleyin. Bu açıklama bol anahtar kelimeli ve çekici olmalıdır.
  - Google botlarının site hiyerarşisini kolayca anlaması için semantik HTML etiketleri (<header>, <main>, <section>, <article>, <footer>) kullanın.
  - Tüm resimlere açıklayıcı ve anahtar kelime barındıran alt özellikleri ekleyin.
  - Sayfanın en altına, Google botlarının işletme bilgilerini doğrudan okuyabilmesi için JSON-LD biçiminde LocalBusiness Yapılandırılmış Veri Şeması (<script type="application/ld+json">) ekleyin. Bu şema içinde işletmenin adı, kategorisi, adresi, telefonu, harita linki ve puanı yer almalıdır.
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

    const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let lastError: any = null;
    let htmlContent = '';

    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${params.geminiApiKey}`;
      
      // Try up to 2 times for each model (in case of temporary 503/429)
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
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

          if (response.status === 503 || response.status === 429) {
            // Temporary overload, wait and retry
            await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
            continue;
          }

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API Hatası (${model}): ${response.status} - ${errText}`);
          }

          const resData: any = await response.json();
          htmlContent = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (htmlContent) {
            break; // Success!
          }
        } catch (err: any) {
          lastError = err;
          // Wait a bit before next attempt
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      if (htmlContent) {
        break; // Success!
      }
    }

    if (!htmlContent) {
      throw lastError || new Error('Gemini API sitesi üretemedi.');
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

    // Vercel handles long project names and collisions by truncating or modifying the slug.
    // Fetch the actual production domains assigned to this project to ensure we store the exact URL.
    try {
      const projectId = data.projectId || (data.project && typeof data.project === 'object' ? data.project.id : null) || data.name || uniqueSlug;
      const domainsUrl = `https://api.vercel.com/v9/projects/${projectId}/domains`;
      const domainsResponse = await fetch(domainsUrl, {
        headers: {
          Authorization: `Bearer ${vercelToken}`,
        },
      });
      if (domainsResponse.ok) {
        const domainsData: any = await domainsResponse.json();
        if (domainsData.domains && domainsData.domains.length > 0) {
          const primaryDomain = domainsData.domains.find((d: any) => d.redirect === null || !d.redirect) || domainsData.domains[0];
          return `https://${primaryDomain.name}`;
        }
      }
    } catch (err) {
      console.error('Vercel domain listesi alınırken hata oluştu:', err);
    }

    // Fallback to the deployment's specific URL if we cannot fetch domains
    return `https://${data.url}`;
  }
}
