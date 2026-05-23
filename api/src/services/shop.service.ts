import { prisma } from '../lib/prisma';
import { HttpException, ErrCodes, statusCodes } from '../utils/exceptions';
import { logger } from '../lib/logger';

export interface ShopOfferPublic {
  offerId: number;
  itemId: number;
  type: string;
  name: string;
  imageUrl: string;
  rarity: string;
  basePrice: number;
  price: number;
  validUntil: Date;
  position: number;
  alreadyOwned: boolean;
}

/**
 * Returns the active shop offers visible to a user.
 * If userId is provided, each offer is flagged with alreadyOwned.
 */
export const listShopOffers = async (userId?: number): Promise<ShopOfferPublic[]> => {
  const now = new Date();

  const offers = await prisma.shopOffer.findMany({
    where: { active: true, validUntil: { gt: now } },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    include: { item: true },
  });

  const ownedIds = userId
    ? new Set(
        (
          await prisma.userCosmetic.findMany({
            where: { userId, itemId: { in: offers.map((o) => o.itemId) } },
            select: { itemId: true },
          })
        ).map((u) => u.itemId),
      )
    : new Set<number>();

  return offers.map((o) => ({
    offerId: o.id,
    itemId: o.itemId,
    type: o.item.type,
    name: o.item.name,
    imageUrl: o.item.imageUrl,
    rarity: o.item.rarity,
    basePrice: o.item.basePrice,
    price: o.price,
    validUntil: o.validUntil,
    position: o.position,
    alreadyOwned: ownedIds.has(o.itemId),
  }));
};

export interface PurchaseResult {
  userCosmeticId: number;
  itemId: number;
  itemName: string;
  rarity: string;
  pricePaid: number;
  moneyAfter: number;
}

/**
 * Buys an item from an active shop offer.
 * Idempotent at the (userId, itemId) level — second call returns 400 ALREADY_OWNED.
 * Transactional: balance check + decrement + UserCosmetic insert all-or-nothing.
 */
export const purchaseOffer = async (userId: number, offerId: number): Promise<PurchaseResult> => {
  return prisma.$transaction(async (tx) => {
    const offer = await tx.shopOffer.findUnique({
      where: { id: offerId },
      include: { item: true },
    });

    if (!offer || !offer.active || offer.validUntil < new Date()) {
      throw new HttpException('Cette offre n\'est plus disponible.', ErrCodes.BAD_REQUEST, statusCodes.BAD_REQUEST, null);
    }

    const user = await tx.users.findUnique({
      where: { ID_User: userId },
      select: { ID_User: true, Money: true, isGuest: true, archived: true },
    });

    if (!user || user.archived) {
      throw new HttpException('Utilisateur introuvable.', ErrCodes.USER_NOT_FOUND, statusCodes.NOT_FOUND, null);
    }
    if (user.isGuest) {
      throw new HttpException('Les invités ne peuvent pas acheter.', ErrCodes.IS_GUEST, statusCodes.FORBIDDEN, null);
    }

    const alreadyOwned = await tx.userCosmetic.findUnique({
      where: { userId_itemId: { userId, itemId: offer.itemId } },
    });
    if (alreadyOwned) {
      throw new HttpException('Vous possédez déjà cet objet.', ErrCodes.BAD_REQUEST, statusCodes.BAD_REQUEST, null);
    }

    if (user.Money < offer.price) {
      throw new HttpException('Solde insuffisant.', ErrCodes.BAD_REQUEST, statusCodes.BAD_REQUEST, {
        balance: user.Money,
        price: offer.price,
      });
    }

    const moneyAfter = user.Money - offer.price;
    await tx.users.update({ where: { ID_User: userId }, data: { Money: moneyAfter } });

    const purchase = await tx.userCosmetic.create({
      data: { userId, itemId: offer.itemId, pricePaid: offer.price },
    });

    logger.info(
      { userId, itemId: offer.itemId, name: offer.item.name, price: offer.price },
      'cosmetic purchased',
    );

    return {
      userCosmeticId: purchase.id,
      itemId: offer.itemId,
      itemName: offer.item.name,
      rarity: offer.item.rarity,
      pricePaid: offer.price,
      moneyAfter,
    };
  });
};
