import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { onlineUserIds } from '../sockets/hub';
import { repairGuilds } from '../services/guilds.service';
import { purgeRefreshTokens } from '../services/tokens.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const SHOP_SIZE = 8;

/** Accounts whose deletion was requested 30 days ago are removed for good. */
export const deleteMarkedUsers = async () => {
  const result = await prisma.users.deleteMany({
    where: { archived: true, deletionDate: { lte: new Date(Date.now() - 30 * DAY_MS) } },
  });
  if (result.count > 0) {
    logger.info({ deleted: result.count }, 'cron: archived accounts purged');
    await repairGuilds();
  }
};

/** Guest accounts are disposable: those idle for a week are removed (unless connected right now). */
export const purgeStaleGuests = async () => {
  const weekAgo = new Date(Date.now() - 7 * DAY_MS);
  const stale = await prisma.users.findMany({
    where: {
      isGuest: true,
      CreatedAt: { lte: weekAgo },
      Sessions: { none: { LastConnection: { gt: weekAgo } } },
    },
    select: { ID_User: true },
  });
  const connected = await onlineUserIds(stale.map((u) => u.ID_User));
  const ids = stale.map((u) => u.ID_User).filter((id) => !connected.has(id));
  if (ids.length === 0) return;
  const result = await prisma.users.deleteMany({ where: { ID_User: { in: ids } } });
  logger.info({ deleted: result.count }, 'cron: stale guests purged');
  await repairGuilds();
};

export const purgeExpiredTokens = async () => {
  await prisma.accountToken.deleteMany({ where: { expiresAt: { lte: new Date(Date.now() - DAY_MS) } } });
  await purgeRefreshTokens();
};

const shuffle = <T>(list: T[]): T[] => [...list].sort(() => Math.random() - 0.5);

/**
 * Daily shop: SHOP_SIZE random cosmetics plus one premium UI theme, valid until the next rotation.
 * Unless forced, it is skipped while unexpired offers exist, so a restart never reshuffles the day's shop.
 */
export const rotateShop = async (force = false) => {
  const now = new Date();
  if (!force) {
    const live = await prisma.shopOffer.count({ where: { active: true, validUntil: { gt: now } } });
    if (live > 0) return;
  }

  const [items, themes] = await Promise.all([
    prisma.cosmeticItem.findMany({ where: { available: true, type: { not: 'ui_theme' } } }),
    prisma.cosmeticItem.findMany({ where: { available: true, type: 'ui_theme', basePrice: { gt: 0 } } }),
  ]);
  const picks = [...shuffle(items).slice(0, SHOP_SIZE), ...shuffle(themes).slice(0, 1)];
  if (picks.length === 0) return;

  // Offers end at the next midnight UTC, when this job runs again.
  const validUntil = new Date(now);
  validUntil.setUTCHours(24, 0, 0, 0);

  await prisma.$transaction([
    prisma.shopOffer.deleteMany({}),
    prisma.shopOffer.createMany({
      data: picks.map((item, position) => ({
        itemId: item.id,
        price: item.basePrice,
        validUntil,
        position,
        active: true,
      })),
    }),
  ]);
  logger.info({ offers: picks.length, validUntil }, 'cron: shop rotated');
};

const run = (name: string, job: () => Promise<void>) => () => {
  job().catch((err) => logger.error({ err, job: name }, 'cron job failed'));
};

export const startCronJobs = () => {
  cron.schedule('0 0 * * *', run('rotateShop', () => rotateShop(true)), { timezone: 'UTC' });
  cron.schedule('15 0 * * *', run('deleteMarkedUsers', deleteMarkedUsers), { timezone: 'UTC' });
  cron.schedule('30 0 * * *', run('purgeStaleGuests', purgeStaleGuests), { timezone: 'UTC' });
  cron.schedule('45 0 * * *', run('purgeExpiredTokens', purgeExpiredTokens), { timezone: 'UTC' });
  // First start, or a server that was down at midnight: fill an empty shop right away.
  run('rotateShop', () => rotateShop())();
};
