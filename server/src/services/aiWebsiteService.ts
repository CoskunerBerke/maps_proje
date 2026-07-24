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

const FALLBACK_IMAGES: Record<string, string[]> = {
  barber: [
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1593702295094-aec22dfad693?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1605497746444-ac9dbd39f477?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop'
  ],
  beauty: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1527891751199-7225231a68dd?q=80&w=800&auto=format&fit=crop'
  ],
  cafe: [
    'https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=800&auto=format&fit=crop'
  ],
  restaurant: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop'
  ],
  auto: [
    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?q=80&w=800&auto=format&fit=crop'
  ],
  general: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop'
  ]
};

const getCategoryKey = (category: string): string => {
  const cat = category.toLowerCase();
  if (cat.includes('berber') || cat.includes('barber') || cat.includes('erkek kuaf')) return 'barber';
  if (cat.includes('güzellik') || cat.includes('kuaför') || cat.includes('salon') || cat.includes('spa') || cat.includes('bayan')) return 'beauty';
  if (cat.includes('cafe') || cat.includes('kahve') || cat.includes('fırın') || cat.includes('pastane')) return 'cafe';
  if (cat.includes('restoran') || cat.includes('yemek') || cat.includes('kebap') || cat.includes('lokanta') || cat.includes('döner')) return 'restaurant';
  if (cat.includes('oto') || cat.includes('yıkama') || cat.includes('servis') || cat.includes('tamir') || cat.includes('araba')) return 'auto';
  return 'general';
};

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
- **Görseller ve Fotoğraflar (KRİTİK - HER KARTTA RESİM ZORUNLUDUR):**
  - Kesinlikle boş gri kutular veya yer tutucu (placeholder) çizimler kullanmayın.
  - **HER HİZMET KARTINDA RESİM ZORUNLULUĞU & GÖRSEL-METİN UYUMU (KRİTİK):**
    - Sitedeki HER BİR hizmet kartı (Card 1, Card 2, Card 3, Card 4 vb.) KESİNLİKLE en üstünde bir <img> görsel etiketi İÇERMELİDİR!
    - **GÖRSEL-METİN UYUMLULUK KURALI:** Kart başlığı ile resim KESİNLİKLE %100 UYUMLU olmalıdır! Örneğin "Protez Tırnak & Nail Art" kartına bina dış cephesi, sokak tabelası (noter, apartman vb.) veya saç görseli koymak KESİNLİKLE YASAKTIR! Dış cephe / sokak görünüm fotoğraflarını ("./photo-1.jpg" gibi) sadece Hero Banner'da veya Mekanımız bölümünde kullanın. Hizmet kartlarına KESİNLİKLE kartın başlığıyla (örneğin Tırnak, Kirpik, Cilt Bakımı, Saç Kesimi) %100 örtüşen yüksek çözünürlüklü görselleri yerleştirin!
  - Size bu işletmeye ait Google Haritalar'dan çekilen ${params.downloadedPhotos.length} adet fotoğraf gönderilmiştir. 
  - Lütfen bu fotoğrafları multimodal olarak tek tek analiz edin:
    1. Eğer fotoğrafta belirgin bir şekilde yakın çekim insan yüzleri, personel veya müşteri kalabalıkları var ise, o fotoğrafı web sitesinde KULLANMAYIN (yani "./photo-N.jpg" dosya yolunu src olarak atamayın).
    2. Eğer fotoğrafta mekanın içi, dışı, ürünleri (örn: yemek tabağı, kahve fincanı, dükkan tezgahı, araçlar vb.) veya genel konsepti insansız görünüyorsa, o görseli "./photo-1.jpg", "./photo-2.jpg", "./photo-3.jpg", "./photo-4.jpg" olarak HER KARTA sırasıyla koyun.
  - **FOTOĞRAF YETMEZLİĞİ VE YEDEK KULLANIMI (KRİTİK - HİÇBİR RESMİ BOŞ/KIRIK BIRAKMAYIN):**
    * Eğer size gönderilen geçerli Google Haritalar fotoğrafı sayısı (örn: ${params.downloadedPhotos.length} adet), sitede kullanmak istediğiniz görsel sayısından az ise, KESİNLİKLE mevcut olmayan "./photo-2.jpg", "./photo-3.jpg" gibi uydurma yolları src olarak kullanmayın!
    * Örneğin sadece 1 adet fotoğraf gönderilmişse, sadece 1 adet görsel için "./photo-1.jpg" yolunu kullanın. Sitedeki diğer tüm görseller (Hizmet kartları, Hakkımızda, Banner vb.) için aşağıdaki listeden işletmeye en uygun olan konseptin Unsplash linklerini birebir kullanın.
    * Kısacası: Sadece gerçekten mevcut olan './photo-1.jpg' ila './photo-N.jpg' arasındaki dosyaları kullanın; eksik kalan tüm görseller için aşağıdaki Unsplash linklerini doldurun. Sitede kesinlikle boş/kırık resim kutusu veya yüklenmeyen resim kalmamalıdır!
    * Tüm <img> etiketlerine güvenlik amacıyla 'onerror="this.style.display=\'none\'"' veya 'onerror="this.src=\'[Unsplash yedek adresi]\'"' özelliğini mutlaka ekleyin.
  - Eğer gönderilen fotoğrafların tamamında insan var ise veya hiç fotoğraf gönderilmemişse, aşağıdaki konseptlerden işletmeye uygun olanı için gerçekçi, yüksek kaliteli Unsplash fotoğraf linklerini kullanın (URL'yi birebir yazın, hayali link uydurmayın):
    * Erkek Kuaförü / Berber / Barber Shop (KRİTİK: KESİNLİKLE kadın saç modeli, oje, makyaj, doktor/medikal/hemşire görselleri KULLANMAYIN!):
      - Banner (Ana Sayfa Görseli): https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop
      - Saç Kesimi Görseli: https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=600&auto=format&fit=crop
      - Sakal Bakımı Görseli: https://images.unsplash.com/photo-1593702295094-aec22dfad693?q=80&w=600&auto=format&fit=crop
      - Yıkama ve Cilt Bakımı Görseli: https://images.unsplash.com/photo-1605497746444-ac9dbd39f477?q=80&w=600&auto=format&fit=crop
      - Hakkımızda Görseli: https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop
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
- **Tasarım Şıklığı & Aydınlık/Ferah Görünüm Kuralları (KRİTİK - SİYAH/BOĞUCU YAPAY ZEKA TEMALARI YASAKTIR):**
  * **AÇIK VE FERAH TEMA (Bright Light Modern Theme):** Web sitesinin tamamında son derece ferah, aydınlık, beyaz ağırlıklı ve lüks bir görünüm uygulayın. Ana sayfa gövdesi: 'bg-slate-50 text-slate-900 min-h-screen'. Siyah veya kasvetli karanlık temalardan kaçının!
  * **ÜST MENÜ LİNKLERİ (HEADER NAV LINKS):**
    - Üst navigasyon barında (Header) 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm' kullanın.
    - Menü linkleri koyu gri/siyah okunaklı ('text-slate-800 font-semibold hover:text-amber-600 transition-colors') olmalıdır!
  * **BAŞLIK KONTRASTI (HERO VE BÖLÜM BAŞLIKLARI):**
    - Sitedeki tüm h1, h2, h3 ana başlıkları pırıl pırıl koyu slate ('text-slate-900 font-extrabold') veya canlı vurgulu renklerle tasarlanmalıdır.
    - Sitede hiçbir başlık silik veya okunaksız olamaz!
  * **KARTLAR VE HİZMETLER:**
    - Tüm kartlar 'bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-lg shadow-slate-200/50 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300' biçiminde beyaz ferah zeminli olmalıdır.
    - HER KARTIN ÜSTÜNDE RESİM YER ALMALIDIR: Kart görseli 'w-full h-56 object-cover' olarak en üste konmalı, altında p-6 iç dolgulu başlık ve açıklama olmalıdır.
    - Kart içi başlıklar: 'text-slate-900 font-bold text-xl' olmalıdır.
    - Kart içi açıklamalar: 'text-slate-600 text-sm leading-relaxed' olmalıdır.
  * **BUTONLAR VE ETKİLEŞİM:**
    - Hero bölümündeki birincil buton ("Randevu Al"): 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-105 transition-all'
    - Hero bölümündeki ikincil buton ("Hizmetleri Keşfet"): 'border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-900 hover:text-white px-8 py-4 rounded-xl transition-all' olmalıdır.
- **MOBİL VE TÜM TARAYICI UYUMLULUĞU (%100 RESPONSIVE - KRİTİK):**
  * Web sitesi iPhone, Android, Tablet ve Tüm Masaüstü tarayıcılara %100 tam uyumlu (responsive) olmalıdır.
  * Mobil görünümde kartlar tek sütun ('grid-cols-1 md:grid-cols-2 lg:grid-cols-3'), başlıklar mobilde ekran dışına taşmayacak şekilde responsive ('text-3xl sm:text-5xl lg:text-6xl font-extrabold') olmalıdır.
  * Mobilde üst menü yazılarının üst üste binmemesi için esnek flex-wrap veya açılır mobil menü yapısı kullanın.
  * Ana gövdeye 'overflow-x-hidden' ekleyerek mobilde yatay kaydırma çubuğu oluşmasını engelleyin.
- **Hareketli & İnteraktif Öğeler (KRİTİK - HATA KORUMALI JAVASCRIPT YAZIN):**
  * Sitede animasyonlar ve interaktif öğeler bolca yer almalı, kullanıcı sayfayı kaydırdıkça site yaşamalıdır.
  * **HATA KORUMASI (JavaScript Çökme Engeli):** Tüm JavaScript fonksiyonlarını ve kodlarını try-catch blokları içine alın. Sayaç animasyonu veya slider çalışırken oluşabilecek herhangi bir hata sayfanın diğer dinamik özelliklerini (sepeti, FAQ akordeonunu) KİLİTLEYEMEZ. Değerleri (Google puanı veya yorum sayıları gibi) DOM'dan parse etmeye çalışmak yerine doğrudan JavaScript kodunun içine statik sayısal değer olarak enjekte edin (örneğin: \`const targetRating = ${params.rating || 4.5};\` ve \`const targetReviewsCount = ${params.reviewsCount || 100};\`). Böylece parseFloat(null) veya DOM elementinin bulunamaması kaynaklı tüm JS hataları engellenir, sayaçlar asla 0.0 veya 0 olarak donup kalmaz!
  * **Kaydırma Animasyonları (Scroll Effects):** Sayfa öğelerine (kartlar, başlıklar vb.) modern CSS animasyonları uygulayın. Örneğin, hover edildiğinde yukarı doğru hafifçe süzülen kartlar ('hover:-translate-y-2 transition-all duration-500 ease-out').
  * **İnteraktif JavaScript Öğeleri (MUTLAKA EKLEYİN):**
    1. **Sayaç Animasyonu (Count-Up):** Sayfa yüklendiğinde Google Maps puanını (örneğin 0'dan 4.9'a) ve mutlu müşteri sayısını (örneğin 0'dan 1500+'e) sıfırdan yukarı doğru sayan şık bir JavaScript animasyonlu istatistik bloğu kurun. requestAnimationFrame veya max 60fps setInterval kullanarak kasmayı engelleyin.
    2. **İnteraktif Sepet ve Tutar Hesaplayıcı (Sepete Ekle & Sepet Çubuğu):**
       - Sitedeki hizmet kartlarının altına "Sepete Ekle" (Add to Cart) butonları yerleştirin.
       - Sayfanın sağ alt veya alt kısmında yapışkan (sticky) şık bir "Sepetim (0 Hizmet) - Toplam: 0 TL" yüzen çubuğu veya sepet çekmecesi tasarlayın.
       - Kullanıcı bir hizmetin altındaki "Sepete Ekle" butonuna bastığında, JavaScript ile bu sepet çubuğu görünür hale gelsin, sepet sayısı artsın ve seçilen hizmetlerin toplam fiyatı dinamik olarak hesaplanarak güncellensin.
       - Sepet içinde "Randevu Al" butonu yer alsın; bu butona basıldığında kullanıcı sayfanın en altındaki İletişim/Rezervasyon formuna yumuşakça kaydırılsın (scroll) ve formdaki "Mesaj" alanına seçtiği hizmetlerin ismi otomatik olarak yazdırılsın.
       - Bu sepet yapısı hem görsel olarak geri bildirim sağlayacak hem de sepete ekle özelliğinin çalıştığını kanıtlayacaktır!
    3. **Yorum Slider'ı (Testimonials Carousel):** Müşteri yorumlarını tek bir alanda gösterip sağ/sol oklarla veya otomatik geçişle (carousel) dönmesini sağlayan basit ve şık bir JavaScript slider yapın.
    4. **Soru-Cevap Sıkça Sorulan Sorular (FAQ Accordion):** Soruların üzerine tıklandığında cevapların aşağı doğru akıcı bir şekilde açılıp kapandığı (accordion) bir bölüm oluşturun. Soru satırına tıklandığında altındaki cevabı gizleyen/gösteren JavaScript kodunu yazın (örneğin classList.toggle('hidden') ile).
- **Arama Motoru Optimizasyonu (SEO) & Google Dostu Yapı (KRİTİK):**
  - Sitede Google arama motorunun sevdiği ve üst sıralara çıkaran anahtar kelime zenginliğine dikkat edin.
  - Sektör ve konuma göre (örneğin işletmenin adresindeki il/ilçe bilgisinden yola çıkarak, örn: "Ankara'nın En İyi Cafe ve Filtre Kahvecisi", "Kadıköy'de Profesyonel Saç Tasarım ve Güzellik Salonu") başlıklar (h1, h2) ve metinler oluşturun.
  - Sayfa başlığını (<title>) işletme adı, kategorisi ve şehri içerecek şekilde arama odaklı yapın.
  - Sayfa için açıklayıcı bir <meta name="description" content="..."> meta etiketi ekleyin. Bu açıklama bol anahtar kelimeli ve çekici olmalıdır.
  - Google botlarının site hiyerarşisini kolayca anlaması için semantik HTML etiketleri (<header>, <main>, <section>, <article>, <footer>) kullanın.
  - Tüm resimlere açıklayıcı ve anahtar kelime barındıran alt özellikleri ekleyin.
  - Sayfanın en altına, Google botlarının işletme bilgilerini doğrudan okuyabilmesi için JSON-LD biçiminde LocalBusiness Yapılandırılmış Veri Şeması (<script type="application/ld+json">) ekleyin. Bu şema içinde işletmenin adı, kategorisi, adresi, telefonu, harita linki ve puanı yer almalıdır.
- **CANLI GOOGLE HARİTA İFRAME ENTEGRASYONU (KRİTİK - MUTLAKA SAYFAYA EKLEYİN):**
  - Sayfada işletmenin canlı konumunu gösteren interaktif harita iframe'i KESİNLİKLE yer almalıdır.
  - Harita iframe'i için kesinlikle şu URL'yi kullanın (iframe'in src özelliğine birebir yerleştirin): "${mapsEmbedUrl}"
  - Harita iframe'ine performansı korumak için mutlaka loading="lazy" ve referrerpolicy="no-referrer-when-downgrade" özelliklerini ekleyin.
  - Örnek: <iframe src="${mapsEmbedUrl}" class="w-full h-96 rounded-2xl border-0" allowfullscreen="" loading="lazy"></iframe>
  - "Haritalar'da Yol Tarifi Al" butonu için yönlendirme URL'si: "${mapsTargetUrl}"
  - Bu sayede kullanıcının tıkladığı buton doğrudan doğru adrese gidecek ve harita doğru yeri gösterecektir.
- **Performans & Akıcılık Kuralları (KASMA/DONMA ENGELİ - KRİTİK):**
  - Sayfadaki tüm görsellere (img etiketleri) mutlaka loading="lazy" özelliğini ekleyin.
  - Sayaç animasyonları (count-up) veya slider geçişleri gibi JavaScript etkileşimlerinde, tarayıcının ana işlemcisini (main thread) bloke edecek sonsuz döngülerden veya ağır reflow tetikleyen kodlardan kaçının. Sayaçlar için requestAnimationFrame veya hafif setTimeout/setInterval (max 60fps) kullanın.
  - Sitenin ilk açılışta akıcı ve hafif (smooth) çalışmasını garanti altına alın.
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

    const apiKeys = params.geminiApiKey.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (apiKeys.length === 0) {
      throw new Error('Geçerli bir Gemini API Key bulunamadı.');
    }

    const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-pro'];
    let lastError: any = null;
    let htmlContent = '';
    let isRateLimited = false;

    for (const key of apiKeys) {
      for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        
        // Try up to 2 times for each model/key combination
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

            if (response.status === 429 || response.status === 503) {
              isRateLimited = true;
              // If rate limited and we have more keys, try next key immediately
              if (apiKeys.length > 1) {
                break;
              }
              await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
              continue;
            }

            if (response.status === 400 || response.status === 401) {
              // Invalid API key, try next key in pool if available
              if (apiKeys.length > 1) {
                break;
              }
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
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
        if (htmlContent) break; // Success!
      }
      if (htmlContent) break; // Success!
    }

    if (!htmlContent) {
      console.warn('Gemini API quota exceeded or unavailable. Generating luxury fallback template locally...');
      htmlContent = buildFallbackHtml(params);
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

    // Server-side rewrite of non-existent photo references to beautiful Unsplash fallbacks
    const categoryKey = getCategoryKey(params.category);
    const fallbacks = FALLBACK_IMAGES[categoryKey] || FALLBACK_IMAGES.general;
    const downloadedCount = params.downloadedPhotos ? params.downloadedPhotos.length : 0;

    // Stage 1: Ultra-broad regex matching photo-X, ./photo-X.jpg, /photo_X.png, photoX.webp etc.
    htmlContent = htmlContent.replace(/(["']?)(?:\.\/|\/)?photo[-_]?(\d+)(?:\.(?:jpg|jpeg|png|webp))?([\s"'`>])/gi, (match, p1, p2, p3) => {
      const photoIndex = parseInt(p2, 10); // 1-indexed
      if (photoIndex > downloadedCount) {
        const fallbackUrl = fallbacks[(photoIndex - 1) % fallbacks.length];
        return `${p1}${fallbackUrl}${p3}`;
      }
      return match;
    });

    // Stage 2: Replace any empty src="" or src='' with a fallback URL
    htmlContent = htmlContent.replace(/<img([^>]*)\bsrc=["']\s*["']([^>]*)>/gi, (match, before, after) => {
      const fallbackUrl = fallbacks[1 % fallbacks.length];
      return `<img${before}src="${fallbackUrl}"${after}>`;
    });

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

function buildFallbackHtml(params: WebGenerationParams): string {
  const categoryKey = getCategoryKey(params.category);
  const fallbacks = FALLBACK_IMAGES[categoryKey] || FALLBACK_IMAGES.general;
  const heroImage = (params.downloadedPhotos && params.downloadedPhotos.length > 0) ? `./photo-1.jpg` : fallbacks[0];
  const img1 = (params.downloadedPhotos && params.downloadedPhotos.length > 1) ? `./photo-2.jpg` : fallbacks[1 % fallbacks.length];
  const img2 = (params.downloadedPhotos && params.downloadedPhotos.length > 2) ? `./photo-3.jpg` : fallbacks[2 % fallbacks.length];
  const img3 = (params.downloadedPhotos && params.downloadedPhotos.length > 3) ? `./photo-4.jpg` : fallbacks[3 % fallbacks.length];

  const ratingVal = params.rating || 4.9;
  const reviewsVal = params.reviewsCount || 128;
  const ratingText = `★ ${ratingVal}`;
  const reviewsText = `(${reviewsVal} Değerlendirme)`;

  // Curated HD category-matching service photos (Guaranteed 100% text-to-image match)
  let services = [
    { title: 'VIP Bakım & Şekillendirme Paketleri', desc: 'Kişiye özel analizler, hijyenik ekipmanlar ve uzman dokunuşlarla üst düzey konforlu bakım.', img: fallbacks[1 % fallbacks.length], price: 'Özel Fiyat' },
    { title: 'Profesyonel Stil & Şekillendirme', desc: 'Son trend stiller, detaylı tasarım ve özgün konseptlerle görünümünüzü yenileyin.', img: fallbacks[2 % fallbacks.length], price: 'Popüler' },
    { title: 'Yüz & Cilt Ferahlatma Terapisi', desc: 'Organik ferahlatma kürleri, derinlemesine buhar bakımı ve yenileyici özel uygulamalar.', img: fallbacks[3 % fallbacks.length], price: 'Tavsiye Edilen' }
  ];

  if (categoryKey === 'beauty') {
    services = [
      { title: 'Protez Tırnak & Estetik Nail Art', desc: 'Kalıcı oje, özel tasarım nail art, medikal manikür ve hijyenik tırnak bakımı.', img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop', price: 'Trend' },
      { title: 'İpek Kirpik & Keratin Kirpik Lifting', desc: 'Doğal hacimli ipek kirpik uygulamaları, keratin lifting ve kaş tasarımı.', img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop', price: 'Çok Satan' },
      { title: 'Derinlemesine Medikal Cilt Bakımı', desc: 'Gözenek sıkılaştırıcı, hyaluronik asit nem bombası ve ışıltı veren medikal cilt bakımı.', img: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=600&auto=format&fit=crop', price: 'VIP' },
      { title: 'Profesyonel Saç Tasarım & Kesim', desc: 'Son trend saç kesimleri, saç botoksu, renk tasarımı ve profesyonel fön.', img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop', price: 'Özel Seri' }
    ];
  } else if (categoryKey === 'barber') {
    services = [
      { title: 'Klasik & Modern Saç Kesimi', desc: 'Yüz tipinize özel profesyonel saç kesimi, yıkama ve fön şekillendirme.', img: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=600&auto=format&fit=crop', price: 'VIP Kesim' },
      { title: 'Sakallı Stil & Buharlı Sakal Bakımı', desc: 'Sıcak havlu kompresli hassas sakal tıraşı, sakal şekillendirme ve bakım yağları.', img: 'https://images.unsplash.com/photo-1593702295094-aec22dfad693?q=80&w=600&auto=format&fit=crop', price: 'Özel Bakım' },
      { title: 'Siyah Nokta & Buharlı Cilt Terapisi', desc: 'Gözenek temizleme, siyah nokta maskesi ve ferahlatıcı cilt bakımı.', img: 'https://images.unsplash.com/photo-1605497746444-ac9dbd39f477?q=80&w=600&auto=format&fit=crop', price: 'Ferahlatıcı' }
    ];
  } else if (categoryKey === 'food' || categoryKey === 'cafe') {
    services = [
      { title: 'Gurme Özel Menü & İmzalı Lezzetler', desc: 'Taze tarladan masaya konseptimizle hazırlanan eşsiz lezzetler ve lezzet şöleni.', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop', price: 'Özel Menü' },
      { title: 'Special Kahve & İçecek Çeşitleri', desc: 'Özel kavrum çekirdeklerden barista imzalı sıcak ve soğuk kahve seçenekleri.', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600&auto=format&fit=crop', price: 'En Sevilen' }
    ];
  }

  const rawPhone = params.phone ? params.phone.replace(/[^0-9]/g, '') : '';
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(params.businessName + ' ' + params.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const mapsTargetUrl = params.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(params.businessName + ' ' + params.address)}`;

          return `<!DOCTYPE html>
<html lang="tr" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${params.businessName} - Resmi Web Sitesi</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 antialiased overflow-x-hidden min-h-screen relative">

    <!-- Header Navigation -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <a href="#" class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 group">
                <span class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 text-lg font-black shadow-md group-hover:scale-105 transition-transform">
                    ${params.businessName.substring(0, 1).toUpperCase()}
                </span>
                <span class="text-slate-900 font-extrabold">${params.businessName}</span>
            </a>
            <nav class="hidden md:flex items-center gap-8">
                <a href="#anasayfa" class="text-slate-800 font-semibold hover:text-amber-600 transition-colors py-1">Anasayfa</a>
                <a href="#hizmetler" class="text-slate-800 font-semibold hover:text-amber-600 transition-colors py-1">Hizmetlerimiz</a>
                <a href="#harita" class="text-slate-800 font-semibold hover:text-amber-600 transition-colors py-1">Canlı Konum</a>
                <a href="#iletisim" class="text-slate-800 font-semibold hover:text-amber-600 transition-colors py-1">İletişim</a>
            </nav>
            <div class="flex items-center gap-3">
                ${params.phone ? `<a href="tel:${params.phone}" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold text-sm hover:brightness-105 transition-all shadow-md shadow-amber-500/20 flex items-center gap-2">
                    <i class="fa-solid fa-phone"></i> <span class="hidden sm:inline">Hemen Ara</span>
                </a>` : ''}
                <button onclick="openModal()" class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-sm transition-all hidden sm:flex items-center gap-2">
                    <i class="fa-solid fa-calendar-check text-amber-600"></i> Randevu Al
                </button>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section id="anasayfa" class="relative pt-32 pb-20 md:pt-44 md:pb-32 bg-gradient-to-b from-amber-50/70 via-slate-50 to-white overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <!-- Pulsing Badge -->
            <div class="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-800 font-semibold text-xs sm:text-sm mb-8 shadow-md">
                <span class="relative flex h-2.5 w-2.5">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span class="text-slate-700 font-medium">Online Randevu Aktif</span>
                <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <span class="text-amber-600 font-bold">${ratingText} ${reviewsText}</span>
            </div>

            <!-- Main Title -->
            <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight max-w-4xl mx-auto">
                ${params.businessName}
            </h1>

            <p class="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
                ${params.address} adresinde yüksek kalite standartlarımız, hijyenik ekibimiz ve özel çözümlerimizle hizmetinizdeyiz.
            </p>

            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                <button onclick="openModal()" class="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold text-base hover:shadow-xl hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-3">
                    <i class="fa-solid fa-calendar-check text-lg"></i> Online Randevu Al
                </button>
                <a href="#harita" class="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-slate-900 text-slate-900 font-bold text-base hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2">
                    <i class="fa-solid fa-map-location-dot"></i> Canlı Konum Gör
                </a>
            </div>

            <!-- Count-Up Stats Bar -->
            <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-slate-200">
                <div class="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
                    <div class="text-2xl sm:text-3xl font-extrabold text-amber-600 mb-1">${ratingVal}</div>
                    <div class="text-xs text-slate-500 font-medium">Google Müşteri Puanı</div>
                </div>
                <div class="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
                    <div class="text-2xl sm:text-3xl font-extrabold text-amber-600 mb-1">${reviewsVal}+</div>
                    <div class="text-xs text-slate-500 font-medium">Değerlendirme & Yorum</div>
                </div>
                <div class="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
                    <div class="text-2xl sm:text-3xl font-extrabold text-amber-600 mb-1">%100</div>
                    <div class="text-xs text-slate-500 font-medium">Hijyen & Kalite</div>
                </div>
                <div class="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
                    <div class="text-2xl sm:text-3xl font-extrabold text-amber-600 mb-1">Uzman</div>
                    <div class="text-xs text-slate-500 font-medium">Profesyonel Kadro</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section id="hizmetler" class="py-20 bg-white border-t border-slate-200/60">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-16">
                <span class="px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-700 font-bold text-xs mb-3 inline-block">
                    HİZMETLERİMİZ
                </span>
                <h2 class="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4">Özel Bakım & Konsept Seçenekler</h2>
                <p class="text-slate-600 text-base sm:text-lg">İhtiyacınıza uygun profesyonel çözümlerimiz</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${services.length} gap-8">
                ${services.map((s) => `
                <div class="bg-white border border-slate-200/90 rounded-3xl overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-300 group flex flex-col">
                    <div class="h-60 overflow-hidden relative">
                        <img src="${s.img}" alt="${s.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <span class="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-amber-400 font-bold text-xs shadow-md">
                            ${s.price}
                        </span>
                    </div>
                    <div class="p-6 flex flex-col flex-grow">
                        <h3 class="text-lg sm:text-xl font-bold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors">${s.title}</h3>
                        <p class="text-slate-600 text-xs sm:text-sm mb-6 font-normal leading-relaxed flex-grow">${s.desc}</p>
                        <button onclick="selectService('${s.title}')" class="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs transition-all text-center">
                            Randevu Oluştur
                        </button>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- Live Google Maps Embedded Section -->
    <section id="harita" class="py-20 bg-slate-50 border-t border-slate-200/60">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-12">
                <span class="px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-800 font-bold text-xs mb-3 inline-block">
                    CANLI KONUM & HARİTA
                </span>
                <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Haritada Canlı Konumumuz</h2>
                <p class="text-slate-600 text-sm sm:text-base">${params.address}</p>
            </div>
            <div class="bg-white p-4 rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <iframe src="${mapsEmbedUrl}" class="w-full h-[450px] rounded-2xl border-0" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            </div>
        </div>
    </section>

    <!-- Location & Contact Info Section -->
    <section id="iletisim" class="py-20 bg-white border-t border-slate-200/60">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="bg-slate-900 text-white rounded-3xl p-8 sm:p-14 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center shadow-2xl">
                <div>
                    <span class="px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs mb-4 inline-block">
                        İLETİŞİM & BİLGİ
                    </span>
                    <h2 class="text-3xl sm:text-4xl font-extrabold text-white mb-6">${params.businessName}</h2>
                    <p class="text-slate-300 mb-8 font-light text-base leading-relaxed">${params.address}</p>
                    <div class="space-y-5">
                        ${params.phone ? `<div class="flex items-center gap-4">
                            <span class="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 text-lg shrink-0">
                                <i class="fa-solid fa-phone"></i>
                            </span>
                            <div>
                                <div class="text-xs text-slate-400 font-medium">Telefon</div>
                                <div class="font-bold text-lg text-white">${params.phone}</div>
                            </div>
                        </div>` : ''}
                        <div class="flex items-center gap-4">
                            <span class="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 text-lg shrink-0">
                                <i class="fa-solid fa-clock"></i>
                            </span>
                            <div>
                                <div class="text-xs text-slate-400 font-medium">Çalışma Saatleri</div>
                                <div class="font-bold text-base text-white">Hafta İçi & Cumartesi: 09:00 - 21:00</div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-10 flex flex-wrap gap-4">
                        ${params.phone ? `<a href="tel:${params.phone}" class="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm transition-all shadow-md flex items-center gap-2">
                            <i class="fa-solid fa-phone"></i> Hemen Ara
                        </a>` : ''}
                        <a href="${mapsTargetUrl}" target="_blank" class="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all border border-slate-700 flex items-center gap-2">
                            <i class="fa-solid fa-map-location-dot text-amber-400"></i> Haritada Yol Tarifi Al
                        </a>
                    </div>
                </div>
                <div class="h-80 sm:h-96 rounded-2xl overflow-hidden relative border border-slate-800 shadow-xl">
                    <img src="${heroImage}" alt="${params.businessName}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-slate-950/40 flex items-center justify-center p-6 text-center">
                        <div class="bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-2xl">
                            <i class="fa-solid fa-location-dot text-amber-400 text-3xl mb-2"></i>
                            <h4 class="font-bold text-white text-lg">${params.businessName}</h4>
                            <p class="text-xs text-slate-300 mt-1">${params.address}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-10 bg-slate-950 text-slate-400 text-center text-xs border-t border-slate-900">
        <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="font-semibold text-white">${params.businessName}</div>
            <p>© 2026 Tüm hakları saklıdır.</p>
        </div>
    </footer>

    <!-- Floating WhatsApp FAB -->
    ${rawPhone ? `<a href="https://wa.me/${rawPhone}?text=Merhaba,%20randevu%20almak%20istiyorum" target="_blank" class="fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full flex items-center justify-center text-2xl shadow-2xl hover:scale-110 transition-all duration-300 shadow-emerald-500/40 group" title="WhatsApp İle İletişime Geçin">
        <i class="fa-brands fa-whatsapp group-hover:rotate-12 transition-transform"></i>
    </a>` : ''}

    <!-- Appointment Modal -->
    <div id="appointment-modal" class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md hidden items-center justify-center p-4">
        <div class="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full relative shadow-2xl">
            <button onclick="closeModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <h3 class="text-2xl font-extrabold text-slate-900 mb-2">Online Randevu Oluştur</h3>
            <p class="text-xs text-slate-500 mb-6">Tarih ve hizmet seçerek anında randevunuzu tamamlayın.</p>
            <div class="space-y-4 text-xs">
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Seçilen Hizmet</label>
                    <input type="text" id="modal-service" value="Özel Bakım Paketi" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none font-bold" readonly>
                </div>
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Tarih Seçin</label>
                    <input type="date" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none">
                </div>
                ${rawPhone ? `<a id="whatsapp-confirm-link" href="https://wa.me/${rawPhone}?text=Merhaba,%20randevu%20almak%20istiyorum" target="_blank" class="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 hover:brightness-105 transition-all shadow-md">
                    <i class="fa-brands fa-whatsapp text-lg"></i> Randevuyu WhatsApp İle Onayla
                </a>` : `<button onclick="alert('Teşekkürler! Randevu talebiniz alınmıştır.')" class="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2">
                    Randevuyu Tamamla
                </button>`}
            </div>
        </div>
    </div>

    <script>
        function openModal() {
            document.getElementById('appointment-modal').classList.remove('hidden');
            document.getElementById('appointment-modal').classList.add('flex');
        }
        function closeModal() {
            document.getElementById('appointment-modal').classList.add('hidden');
            document.getElementById('appointment-modal').classList.remove('flex');
        }
        function selectService(serviceName) {
            document.getElementById('modal-service').value = serviceName;
            const link = document.getElementById('whatsapp-confirm-link');
            if (link) {
                const phone = '${rawPhone}';
                link.href = 'https://wa.me/' + phone + '?text=' + encodeURIComponent('Merhaba, ' + serviceName + ' hizmeti için randevu almak istiyorum.');
            }
            openModal();
        }
    </script>
</body>
</html>`;
}
