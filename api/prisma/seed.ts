/**
 * KILLSPY seed — demo cosmetics + sample shop offers + UI themes.
 * Run with:   npm run seed   (or `npx prisma db seed`)
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

// ===========================================================================
// CATALOG
// ===========================================================================

const COSMETICS: SeedItem[] = [
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

/**
 * UI Themes — the same 5 colour palettes as before, but now sold as cosmetics.
 * The first one (spyCasual / "Agent Mint") is offered for free at signup.
 * Keep the `name` field IN SYNC with the client mapping in
 * `game/src/theme/themes.ts` (THEME_COSMETIC_META.label).
 */
const UI_THEMES: SeedItem[] = [
  { type: 'ui_theme', name: 'Agent Mint',              imageUrl: 'https://placehold.co/512x256/0d1929/3FE7A0?text=AGENT+MINT',         basePrice: 0,    rarity: 'common' },
  { type: 'ui_theme', name: 'Futur Urbain',            imageUrl: 'https://placehold.co/512x256/343a40/007bff?text=FUTUR+URBAIN',       basePrice: 250,  rarity: 'uncommon' },
  { type: 'ui_theme', name: 'Infiltration Naturelle',  imageUrl: 'https://placehold.co/512x256/f5f5dc/228b22?text=INFILTRATION',       basePrice: 500,  rarity: 'rare' },
  { type: 'ui_theme', name: 'Mystère Nocturne',        imageUrl: 'https://placehold.co/512x256/000000/4a5a2d?text=MYSTERE+NOCTURNE',   basePrice: 900,  rarity: 'epic' },
  { type: 'ui_theme', name: 'Technologie Avancée',     imageUrl: 'https://placehold.co/512x256/000000/00ffff?text=TECH+AVANCEE',       basePrice: 1500, rarity: 'legendary' },
  { type: 'ui_theme', name: 'Élégance Classique',      imageUrl: 'https://placehold.co/512x256/001f3f/ffd700?text=ELEGANCE',           basePrice: 3000, rarity: 'mythic' },
];

const ALL_ITEMS: SeedItem[] = [...COSMETICS, ...UI_THEMES];

// ===========================================================================
// RUN
// ===========================================================================

const main = async () => {
  console.log('🌱 Seeding cosmetics + UI themes...');

  for (const item of ALL_ITEMS) {
    await prisma.cosmeticItem.upsert({
      where: { name: item.name },
      update: { type: item.type, imageUrl: item.imageUrl, basePrice: item.basePrice, rarity: item.rarity },
      create: item,
    });
  }

  // Auto-grant the free default UI theme to every existing user (idempotent).
  const defaultTheme = await prisma.cosmeticItem.findUnique({ where: { name: 'Agent Mint' } });
  if (defaultTheme) {
    const users = await prisma.users.findMany({ where: { isGuest: false }, select: { ID_User: true } });
    for (const u of users) {
      await prisma.userCosmetic.upsert({
        where: { userId_itemId: { userId: u.ID_User, itemId: defaultTheme.id } },
        update: {},
        create: { userId: u.ID_User, itemId: defaultTheme.id, pricePaid: 0 },
      });
      await prisma.equippedCosmetic.upsert({
        where: { userId_type: { userId: u.ID_User, type: 'ui_theme' } },
        update: {},
        create: { userId: u.ID_User, type: 'ui_theme', itemId: defaultTheme.id },
      });
    }
    console.log(`✅ Default theme "Agent Mint" granted/ensured for ${users.length} users.`);
  }

  // Shop rotation: 8 random non-theme items + the most premium theme of the day.
  const all = await prisma.cosmeticItem.findMany({
    where: { available: true, type: { not: 'ui_theme' } },
  });
  const shuffled = all.sort(() => Math.random() - 0.5).slice(0, 8);

  // Also feature one premium theme rotated daily.
  const featuredTheme = await prisma.cosmeticItem.findFirst({
    where: { type: 'ui_theme', basePrice: { gt: 0 } },
    orderBy: { basePrice: 'desc' },
  });

  const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.shopOffer.deleteMany({});

  for (let i = 0; i < shuffled.length; i++) {
    const item = shuffled[i];
    await prisma.shopOffer.create({
      data: { itemId: item.id, price: item.basePrice, validUntil, position: i, active: true },
    });
  }

  if (featuredTheme) {
    await prisma.shopOffer.create({
      data: { itemId: featuredTheme.id, price: featuredTheme.basePrice, validUntil, position: shuffled.length, active: true },
    });
  }

  console.log(`✅ Seeded ${ALL_ITEMS.length} items (${COSMETICS.length} cosmetics + ${UI_THEMES.length} themes), ${shuffled.length + (featuredTheme ? 1 : 0)} shop offers.`);
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
