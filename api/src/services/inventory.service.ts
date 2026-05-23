import { CosmeticType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpException, ErrCodes, statusCodes } from '../utils/exceptions';

export interface OwnedCosmetic {
  userCosmeticId: number;
  itemId: number;
  type: CosmeticType;
  name: string;
  imageUrl: string;
  rarity: string;
  acquiredAt: Date;
  pricePaid: number;
  equipped: boolean;
}

export const listOwned = async (userId: number): Promise<OwnedCosmetic[]> => {
  const [owned, equipped] = await Promise.all([
    prisma.userCosmetic.findMany({
      where: { userId },
      orderBy: { acquiredAt: 'desc' },
      include: { item: true },
    }),
    prisma.equippedCosmetic.findMany({
      where: { userId },
      select: { itemId: true },
    }),
  ]);

  const equippedSet = new Set(equipped.map((e) => e.itemId));

  return owned.map((u) => ({
    userCosmeticId: u.id,
    itemId: u.itemId,
    type: u.item.type,
    name: u.item.name,
    imageUrl: u.item.imageUrl,
    rarity: u.item.rarity,
    acquiredAt: u.acquiredAt,
    pricePaid: u.pricePaid,
    equipped: equippedSet.has(u.itemId),
  }));
};

export interface EquipResult {
  type: CosmeticType;
  itemId: number;
  name: string;
}

/** Equip a cosmetic — only one per type at a time (upsert). */
export const equip = async (userId: number, itemId: number): Promise<EquipResult> => {
  const owned = await prisma.userCosmetic.findUnique({
    where: { userId_itemId: { userId, itemId } },
    include: { item: true },
  });

  if (!owned) {
    throw new HttpException('Vous ne possédez pas cet objet.', ErrCodes.BAD_REQUEST, statusCodes.BAD_REQUEST, null);
  }

  await prisma.equippedCosmetic.upsert({
    where: { userId_type: { userId, type: owned.item.type } },
    update: { itemId },
    create: { userId, type: owned.item.type, itemId },
  });

  return { type: owned.item.type, itemId, name: owned.item.name };
};

/** Remove the equipped cosmetic of a given type. */
export const unequip = async (userId: number, type: CosmeticType): Promise<void> => {
  await prisma.equippedCosmetic
    .delete({ where: { userId_type: { userId, type } } })
    .catch(() => undefined); // idempotent
};

export const getEquippedMap = async (userId: number) => {
  const rows = await prisma.equippedCosmetic.findMany({
    where: { userId },
    include: { item: true },
  });
  return rows.reduce<Record<string, { itemId: number; name: string; imageUrl: string; rarity: string }>>(
    (acc, r) => {
      acc[r.type] = {
        itemId: r.itemId,
        name: r.item.name,
        imageUrl: r.item.imageUrl,
        rarity: r.item.rarity,
      };
      return acc;
    },
    {},
  );
};
