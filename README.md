# Eksik Web — Local Business Website Finder

**A lead-generation and CRM tool that scans nearby businesses on Google Maps and finds the ones without a website.**

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-1-6E9F18?logo=vitest&logoColor=white)

> **Status:** personal tool, built to run locally (a Windows launcher script is included). Work in progress.

## Overview

Eksik Web ("missing web") scans the area around a chosen location through the **Google Places API (New)** and classifies every business as:

- **no website**
- **social media only** (Instagram, Facebook, TikTok, X, YouTube, LinkedIn)
- **has a website**

It is designed for freelancers and small agencies who sell web design / SEO services to local businesses: find the businesses that need a website, track calls and notes in a built-in CRM, and export the list.

## Features

- **Dashboard** — overall statistics for scans and businesses found
- **New scan** — pick a location (or use your current location), radius and categories, then run a Places Nearby Search
- **Results list** — filter by website status and CRM status, sort by distance, rating or review count; export to **CSV** or **Excel (.xlsx)**
- **Map view** — results plotted on an interactive Leaflet map
- **CRM tracking** — call status and notes per business
- **Excluded brands** — skip chain brands so only independent businesses are listed
- **Demo mode** — works without an API key using seeded sample businesses (Ankara / Istanbul)
- **Demo site generator (experimental)** — for a selected business, generates a one-page website with the Gemini API (using its Google photos and 4–5 star reviews) and deploys it to Vercel; the Gemini key and Vercel token are entered on the Settings page
- Simple in-memory rate limiting and request validation with Zod

## Tech stack

| Layer | Technology |
| --- | --- |
| Client | React 18, TypeScript, Vite, Tailwind CSS, React Leaflet, lucide-react |
| Server | Node.js, Express, TypeScript, Zod, xlsx |
| Database | Prisma ORM + SQLite |
| External APIs | Google Places API (New), Gemini API, Vercel API |
| Tests | Vitest |

## Project structure

```
maps_proje/
├── client/                 # React + Vite front end
│   └── src/pages/          # Dashboard, NewScan, Businesses, MapView, CRMTracking, Settings
├── server/                 # Express + Prisma back end
│   ├── prisma/             # schema.prisma, migrations, seed.ts
│   └── src/
│       ├── routes/         # places, businesses, sessions, settings, statistics, excluded-brands
│       ├── services/       # placesService, aiWebsiteService
│       ├── utils/          # website classifier, distance, email finder
│       └── tests/          # Vitest tests
├── baslat.bat              # Windows one-click launcher
└── package.json            # root scripts (runs client + server together)
```

## Getting started

Requirements: **Node.js 20+**.

```bash
# 1. Install root, client and server dependencies
npm run install:all

# 2. Create the server environment file
cp server/.env.example server/.env        # PowerShell: Copy-Item server/.env.example server/.env

# 3. Prepare the database
npm run prisma:generate --prefix server
npm run prisma:migrate --prefix server
npm run prisma:seed --prefix server

# 4. Start client (http://localhost:5173) and server (port 3001)
npm run dev
```

Other scripts: `npm run build`, `npm start`, `npm test`.

### Environment variables (`server/.env`)

| Name | Purpose |
| --- | --- |
| `GOOGLE_MAPS_API_KEY` | Google Places API (New) key. If empty, the app runs in demo mode. |
| `PORT` | API server port (default `3001`) |
| `DATABASE_URL` | SQLite connection string, e.g. `file:./dev.db` |

### Google Cloud setup (short)

1. Create a project in Google Cloud Console and attach a billing account.
2. Enable **Places API (New)**.
3. Create an API key and **restrict it to the Places API**.
4. Set budget alerts and daily quotas to avoid unexpected costs.

### Troubleshooting (Windows)

- **Execution policy error:** `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- **Port 3001/5173 already in use:** stop the process that owns the port, then run `npm run dev` again.
- **SQLite/Prisma lock:** delete `server/prisma/dev.db` and re-run the migrate and seed commands.

---

## Türkçe

**Eksik Web**, Google Haritalar üzerinden çevredeki işletmeleri tarayıp **web sitesi olmayan** veya **yalnızca sosyal medya hesabı olan** işletmeleri bulan bir potansiyel müşteri (lead) bulma ve CRM aracıdır.

> **Durum:** Yerelde çalışacak şekilde geliştirilmiş kişisel bir araç (Windows için başlatma dosyası mevcut). Geliştirme devam ediyor.

### Ne işe yarar?

Yerel işletmelere web tasarım ve SEO hizmeti satan serbest çalışanlar ve küçük ajanslar için tasarlandı. Seçilen konum çevresindeki işletmeler **Google Places API (New)** ile taranır ve her işletme "web sitesi yok", "sadece sosyal medya" veya "web sitesi var" olarak sınıflandırılır.

### Özellikler

- **Genel Durum Paneli** — tarama ve işletme istatistikleri
- **Yeni Bölge Tarama** — konum, yarıçap ve kategori seçerek tarama başlatma
- **İşletmeler Sonuç Listesi** — web sitesi ve CRM durumuna göre filtreleme, mesafe/puan/yorum sayısına göre sıralama, **CSV** ve **Excel** dışa aktarma
- **Harita Görünümü** — sonuçların Leaflet haritası üzerinde gösterimi
- **Müşteri Takip Sistemi (CRM)** — arama durumu ve notlar
- **Hariç tutulan markalar** — zincir markaları sonuçlardan çıkarma
- **Demo Modu** — API anahtarı olmadan örnek verilerle test
- **Demo site oluşturucu (deneysel)** — seçilen işletme için Gemini API ile tek sayfalık site üretip Vercel'e yükler; Gemini anahtarı ve Vercel token'ı Ayarlar sayfasından girilir

### Kurulum

Gereksinim: **Node.js 20+**

```bash
npm run install:all
cp server/.env.example server/.env
npm run prisma:generate --prefix server
npm run prisma:migrate --prefix server
npm run prisma:seed --prefix server
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılır; API `3001` portunda çalışır. Windows'ta `baslat.bat` dosyası uygulamayı tek tıkla başlatır.

**Ortam değişkenleri (`server/.env`):** `GOOGLE_MAPS_API_KEY`, `PORT`, `DATABASE_URL`. API anahtarı girilmezse uygulama demo modunda çalışır.

**Google Cloud:** Proje oluşturun, faturalandırma hesabı bağlayın, **Places API (New)**'yi etkinleştirin, API anahtarı oluşturup yalnızca Places API ile sınırlandırın ve bütçe uyarısı / günlük kota belirleyin.

---

Built by [Berke Coşkuner](https://github.com/CoskunerBerke)
