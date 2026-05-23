import { apiClient } from './client';
import { CosmeticType } from './shop';
import { RarityId } from '../game/rarities';

export interface OwnedCosmetic {
  userCosmeticId: number;
  itemId: number;
  type: CosmeticType;
  name: string;
  imageUrl: string;
  rarity: RarityId;
  acquiredAt: string;
  pricePaid: number;
  equipped: boolean;
}

export interface EquippedItem {
  itemId: number;
  name: string;
  imageUrl: string;
  rarity: RarityId;
}

export interface InventoryResponse {
  owned: OwnedCosmetic[];
  equipped: Partial<Record<CosmeticType, EquippedItem>>;
}

export const getInventory = async (): Promise<InventoryResponse> => {
  const { data } = await apiClient.get<InventoryResponse>('/inventory');
  return data;
};

export const equipItem = async (itemId: number): Promise<{ type: CosmeticType; itemId: number; name: string }> => {
  const { data } = await apiClient.post<{ equipped: { type: CosmeticType; itemId: number; name: string } }>(
    '/inventory/equip',
    { itemId },
  );
  return data.equipped;
};

export const unequipType = async (type: CosmeticType): Promise<void> => {
  await apiClient.delete(`/inventory/equip/${type}`);
};
