-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN "geminiApiKey" TEXT;
ALTER TABLE "AppSettings" ADD COLUMN "vercelToken" TEXT;

-- AlterTable
ALTER TABLE "Business" ADD COLUMN "demoWebsiteUrl" TEXT;
ALTER TABLE "Business" ADD COLUMN "email" TEXT;
