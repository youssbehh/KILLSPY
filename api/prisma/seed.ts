/**
 * KILLSPY seed — demo cosmetics + sample shop offers.
 * Run with:   npx prisma db seed
 * (Add `"prisma": { "seed": "ts-node prisma/seed.ts" }` to package.json if missing.)
 */
import { CosmeticType, PrismaClient, Rarity } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedItem {
  type: CosmeticType;
  name: string;
  imageUrl: string;
  basePrice: number;
  rarity: Rarity;
}

const ITEMS: SeedItem[] = [
  // ---- AVATARS ----
  { type: 'avatar', name: 'Espion en costume',  imageUrl: 'https://placehold.co/256x256/343a40/ffffff?text=AGENT',     basePrice: 50,   rarity: 'common' },
  { type: 'avatar', name: 'Sniper masqué',      imageUrl: 'https://placehold.co/256x256/2ecc71/ffffff?text=SNIPER',    basePrice: 120,  rarity: 'uncommon' },
  { type: 'avatar', name: 'Ninja des ombres',   imageUrl: 'https://placehold.co/256x256/3498db/ffffff?text=NINJA',     basePrice: 250,  rarity: 'rare' },
  { type: 'avatar', name: 'Détective culte',    imageUrl: 'https://placehold.co/256x256/9b59b6/ffffff?text=DETECTIVE', basePrice: 500,  rarity: 'epic' },
  { type: 'avatar', name: 'Maître Espion 007',  imageUrl: 'https://placehold.co/256x256/ffd700/000000?text=007',       basePrice: 1000, rarity: 'legendary' },
  { type: 'avatar', name: 'Le Fantôme',         imageUrl: 'https://placehold.co/256x256/e74c3c/ffffff?text=GHOST',     basePrice: 2500, rarity: 'mythic' },

  // ---- CARD SKINS ----
  { type: 'card_skin', name: 'Carte standard',     imageUrl: 'https://placehold.co/512x256/9e9e9e/000000?text=STANDARD', basePrice: 30,   rarity: 'common' },
  { type: 'card_skin', name: 'Carte holographique', imageUrl: 'https://placehold.co/512x256/00ffff/000000?text=HOLO',    basePrice: 300,  rarity: 'rare' },
  { type: 'card_skin', name: 'Carte dorée',        imageUrl: 'https://placehold.co/512x256/ffd700/000000?text=GOLD',    basePrice: 800,  rarity: 'legendary' },
  { type: 'card_skin', name: 'Carte fantôme',      imageUrl: 'https://placehold.co/512x256/000000/ffffff?text=GHOST',   basePrice: 5000, rarity: 'secret' },

  // ---- EMOTES ----
  { type: 'emote', name: 'Pouce levé',     imageUrl: 'https://placehold.co/128x128/2ecc71/ffffff?text=%F0%9F%91%8D', basePrice: 25,  rarity: 'common' },
  { type: 'emote', name: 'Salut militaire', imageUrl: 'https://placehold.co/128x128/3498db/ffffff?text=SALUTE',     basePrice: 80,  rarity: 'uncommon' },
  { type: 'emote', name: 'Rire diabolique', imageUrl: 'https://placehold.co/128x128/9b59b6/ffffff?text=MWAHAHA',    basePrice: 200, rarity: 'rare' },
  { type: 'emote', name: 'GG',              imageUrl: 'https://placehold.co/128x128/ffd700/000000?text=GG',         basePrice: 50,  rarity: 'common' },

  // ---- BACKGROUNDS ----
  { type: 'background', name: 'Skyline néon',     imageUrl: 'https://placehold.co/1280x720/007bff/ffffff?text=NEON',     basePrice: 150, rarity: 'uncommon' },
  { type: 'background', name: 'Jungle tropicale', imageUrl: 'https://placehold.co/1280x720/228b22/ffffff?text=JUNGLE',   basePrice: 200, rarity: 'rare' },
  { type: 'background', name: 'Bunker secret',    imageUrl: 'https://placehold.co/1280x720/2e2e2e/c0c0c0?text=BUNKER',   basePrice: 400, rarity: 'epic' },
  { type: 'background', name: 'Casino royal',     imageUrl: 'https://placehold.co/1280x720/001f3f/ffd700?text=CASINO',   basePrice: 900, rarity: 'legendary' },
];

const main = async () => {
  console.log('🌱 Seeding cosmetics...');

  for (const item of ITEMS) {
    await prisma.cosmeticItem.upsert({
      where: { name: item.name },
      update: { type: item.type, imageUrl: item.imageUrl, basePrice: item.basePrice, rarity: item.rarity },
      create: item,
    });
  }

  // Active offers: 8 random items in the shop, valid for 24h.
  const all = await prisma.cosmeticItem.findMany({ where: { available: true } });
  const shuffled = all.sort(() => Math.random() - 0.5).slice(0, 8);

  const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.shopOffer.deleteMany({});
  for (let i = 0; i < shuffled.length; i++) {
    const item = shuffled[i];
    await prisma.shopOffer.create({
      data: {
        itemId: item.id,
        price: item.basePrice,
        validUntil,
        position: i,
        active: true,
      },
    });
  }

  console.log(`✅ Seeded ${ITEMS.length} cosmetics and ${shuffled.length} shop offers.`);
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
