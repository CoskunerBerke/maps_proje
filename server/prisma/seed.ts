import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CHAIN_BRANDS = [
  'Starbucks',
  "McDonald's",
  'Burger King',
  'KFC',
  "Domino's",
  'LC Waikiki',
  'DeFacto',
  'Mavi',
  'FLO',
  'Watsons',
  'Gratis'
];

async function main() {
  console.log('Seeding settings and default chain brands...');

  // 1. App Settings
  await prisma.appSettings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      dailyMaxSearches: 100,
      maxCategoriesPerSearch: 10,
      maxBusinessesPerSearch: 100,
      isDemoMode: false,
    },
  });

  // 2. Excluded Chain Brands
  for (const brand of DEFAULT_CHAIN_BRANDS) {
    await prisma.excludedBrand.upsert({
      where: { name: brand },
      update: {},
      create: { name: brand },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
