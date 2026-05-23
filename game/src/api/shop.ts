import { apiClient } from './client';
import { RarityId } from '../game/rarities';

export type CosmeticType =
  | 'avatar'
  | 'card_skin'
  | 'emote'
  | 'background'
  | 'shoot_anim'
  | 'shield_anim'
  | 'name_effect';

export interface ShopOffer {
  offerId: number;
  itemId: number;
  type: CosmeticType;
  name: string;
  imageUrl: string;
  rarity: RarityId;
  basePrice: number;
  price: number;
  validUntil: string;
  position: number;
  alreadyOwned: boolean;
}

export interface PurchaseResult {
  userCosmeticId: number;
  itemId: number;
  itemName: string;
  rarity: RarityId;
  pricePaid: number;
  moneyAfter: number;
}

export const getShop = async (): Promise<ShopOffer[]> => {
  const { data } = await apiClient.get<{ offers: ShopOffer[] }>('/shop');
  return data.offers;
};

export const purchaseOffer = async (offerId: number): Promise<PurchaseResult> => {
  const { data } = await apiClient.post<{ result: PurchaseResult }>(`/shop/purchase/${offerId}`);
  return data.result;
};
