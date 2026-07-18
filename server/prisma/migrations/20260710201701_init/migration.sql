-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "primaryType" TEXT,
    "types" TEXT NOT NULL,
    "formattedAddress" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "rating" REAL,
    "userRatingCount" INTEGER,
    "websiteUri" TEXT,
    "websiteStatus" TEXT NOT NULL,
    "nationalPhoneNumber" TEXT,
    "internationalPhoneNumber" TEXT,
    "googleMapsUri" TEXT,
    "businessStatus" TEXT,
    "isOpen" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "callingStatus" TEXT NOT NULL DEFAULT 'Henüz aranmadı',
    "searchSessionId" TEXT,
    CONSTRAINT "Business_searchSessionId_fkey" FOREIGN KEY ("searchSessionId") REFERENCES "SearchSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SearchSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "radius" REAL NOT NULL,
    "categories" TEXT NOT NULL,
    "totalFound" INTEGER NOT NULL,
    "noWebsiteCount" INTEGER NOT NULL,
    "requestCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT
);

-- CreateTable
CREATE TABLE "BusinessNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BusinessNote_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "dailyMaxSearches" INTEGER NOT NULL DEFAULT 100,
    "maxCategoriesPerSearch" INTEGER NOT NULL DEFAULT 10,
    "maxBusinessesPerSearch" INTEGER NOT NULL DEFAULT 100,
    "isDemoMode" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "ExcludedBrand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ExcludedBrand_name_key" ON "ExcludedBrand"("name");
