# Eksik Web - Yakındaki Web Sitesi Olmayan İşletmeleri Tespit Etme Uygulaması

Bu web uygulaması, kullanıcının çevresindeki yerel işletmeleri Google Places API (New) üzerinden tarayarak **web sitesi bulunmayan** veya **yalnızca sosyal medya hesabı (Instagram, Facebook vb.) olan** işletmeleri tespit eder. Yerel işletmelere web tasarım ve SEO hizmetleri satmak isteyen ajanslar ve serbest çalışanlar (freelancer) için bir **B2B potansiyel müşteri bulma (lead generation) ve CRM takip aracı** olarak tasarlanmıştır.

---

## Proje Yapısı

Proje iki ana klasörden oluşmaktadır:
- `/client`: React, Vite, TypeScript, Tailwind CSS, Leaflet Maps (Önyüz)
- `/server`: Node.js, Express, TypeScript, Prisma, SQLite (Arkayüz & Veritabanı)

---

## Windows Kurulum ve Çalıştırma Kılavuzu

### Gereksinimler
- **Node.js**: Sürüm 20 veya üzeri kurulu olmalıdır ([Node.js İndir](https://nodejs.org/)).

### Adım Adım Kurulum (PowerShell)

Aşağıdaki komutları sırasıyla Windows PowerShell terminalinde çalıştırın:

1. **Proje klasörünü terminalde açın:**
   ```powershell
   cd "C:\Users\berke\OneDrive\Masaüstü\Maps proje"
   ```

2. **Bağımlılıkları tek bir komutla yükleyin:**
   ```powershell
   npm run install:all
   ```

3. **Çevresel değişkenler (.env) dosyasını oluşturun:**
   ```powershell
   Copy-Item server/.env.example server/.env
   ```

4. **API Anahtarını ekleyin:**
   `server/.env` dosyasını herhangi bir metin editörü (Notepad, VS Code vb.) ile açın ve `GOOGLE_MAPS_API_KEY=` kısmına Google Cloud'dan aldığınız API anahtarını ekleyin (API anahtarınız yoksa uygulamayı test etmek için Ayarlar sayfasından **Demo Modu**'nu aktifleştirebilirsiniz).
   ```env
   GOOGLE_MAPS_API_KEY=AIzaSy...
   PORT=3001
   DATABASE_URL="file:./dev.db"
   ```

5. **Prisma veritabanını hazırlayın (Tabloları oluşturun ve seed verilerini yükleyin):**
   ```powershell
   npm run prisma:generate --prefix server
   npm run prisma:migrate --prefix server
   npm run prisma:seed --prefix server
   ```

6. **Uygulamayı geliştirme modunda (Dev) başlatın:**
   ```powershell
   npm run dev
   ```
   Bu komut, önyüz (port 5173) ve arkayüz (port 3001) sunucularını aynı anda başlatır.

7. **Tarayıcınızda uygulamayı açın:**
   [http://localhost:5173](http://localhost:5173)

---

## Google Cloud Platform (GCP) Ayarları

Gerçek işletme verilerini taramak için bir Google Harita API anahtarına ihtiyacınız vardır. Aşağıdaki adımları takip ederek anahtarınızı oluşturabilirsiniz:

1. **Google Cloud Console'a gidin:** [GCP Console](https://console.cloud.google.com/) adresinde oturum açın.
2. **Proje Oluşturun:** Sol üst menüden yeni bir proje oluşturun veya mevcut bir projeyi seçin.
3. **Faturalandırma (Billing) Hesabı Bağlayın:** Google Harita API'lerini kullanabilmek için projenize geçerli bir faturalandırma hesabı (kredi kartı) bağlamalısınız. *Not: Google her ay her hesap için 200$'lık ücretsiz kullanım kredisi tanımlar.*
4. **Places API (New) Etkinleştirin:** "API'ler ve Hizmetler" > "Kitaplık" (Library) bölümüne gidin. **Places API** aramasını yapın ve **Etkinleştir** (Enable) butonuna tıklayın.
5. **API Anahtarı Oluşturun:** "API'ler ve Hizmetler" > "Kimlik Bilgileri" (Credentials) sekmesine tıklayın. **Kimlik Bilgisi Oluştur** > **API Anahtarı** (API Key) seçeneğini seçin.
6. **API Anahtarını Sınırlandırın (Güvenlik Önlemi):** 
   - Oluşturulan anahtarın ayarlarına gidin.
   - "API Sınırlandırmaları" (API Restrictions) altından **Places API**'yi seçin. Bu sayede anahtarınız çalınsa bile diğer GCP servislerinde kullanılamaz.
7. **Bütçe Uyarısı ve Kota Belirleyin:**
   - Beklenmedik maliyetleri engellemek için "Faturalandırma" > "Bütçeler ve Uyarılar" sekmesinden bütçe uyarıları ayarlayın.
   - "Places API" > "Yönet" > "Kotalar" kısmından günlük maksimum istek limiti belirleyebilirsiniz.

---

## Demo Modu Nasıl Çalışır?

Uygulamanın çalışmasını Google API anahtarınız olmadan test etmek istiyorsanız **Demo Modu**'nu kullanabilirsiniz:
1. Uygulamada **Ayarlar** sayfasına gidin.
2. **"Demo Verileriyle Çalış"** seçeneğini aktif hale getirin.
3. **Yeni Tarama** sayfasında Ankara veya İstanbul yakınlarında (Örn: Enlem 39.9334, Boylam 32.8597) arama başlattığınızda sistem Google Places API'ye istek göndermez, onun yerine veritabanındaki zengin seed verileri üzerinden simülasyon gerçekleştirir.
4. Bu modda, bazı işletmelerin web sitesi null, bazılarının sadece Instagram hesabı var, bazılarının ise web sitesi var olarak döner ve tüm CRM, Harita ve Dışa Aktarım özelliklerini test edebilirsiniz.

---

## Gerçek Google Places API İle Test Adımları

1. `server/.env` dosyasındaki `GOOGLE_MAPS_API_KEY` alanına geçerli bir API anahtarı ekleyin.
2. Ayarlar sayfasından **Demo Modu**'nu kapatın.
3. Yeni Tarama sayfasına gelerek **"Konumumu Kullan"** butonuna basın veya haritadan arama yapmak istediğiniz konumu seçin.
4. Kategorileri seçin (Örn: Kafe, Kuaför, Restoran) ve **Taramayı Başlat** butonuna basın.
5. Google Places API (New) Nearby Search endpoint'i üzerinden canlı veriler çekilecek, sistem web sitelerini sınıflandıracak ve sizi sonuç tablosuna yönlendirecektir.

---

## Olası Windows PowerShell Hataları ve Çözümleri

### 1. `Execution Policy` (Betik Çalıştırma Engeli) Hatası
**Hata:** PowerShell scriptleri veya npm komutları çalıştırılırken `Scriptlerin çalıştırılması sisteminizde devre dışı bırakıldığından...` gibi bir güvenlik uyarısı alabilirsiniz.
**Çözüm:** PowerShell'i **Yönetici Olarak** açın ve şu komutu çalıştırın:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Ardından gelen soruya `Y` (Evet) yanıtını verin ve terminali kapatıp yeniden açın.

### 2. `PORT 3001 veya 5173 Zaten Kullanımda` Hatası
**Hata:** Node sunucusu başlatılırken `Error: listen EADDRINUSE: address already in use :::3001` hatası alabilirsiniz.
**Çözüm:** Bu portları kullanan arka plan işlemlerini kapatmak için PowerShell'de şu komutu çalıştırın:
```powershell
# Port 3001'i dinleyen işlemi bulup kapatmak için:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force
```

### 3. SQLite veya Prisma Kilitlenme Hatası
**Hata:** SQLite veritabanı kilitlendiğinde veya Prisma migration uygulanırken hata alındığında.
**Çözüm:** `server/prisma/dev.db` dosyasını silin ve migration komutlarını baştan çalıştırın:
```powershell
Remove-Item server/prisma/dev.db -ErrorAction SilentlyContinue
npm run prisma:migrate --prefix server
npm run prisma:seed --prefix server
```
