import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as inventoryApi from '../api/inventory';
import { useAuthStore } from '../stores/authStore';
import { CosmeticType } from '../api/shop';
import { CombatLook, lookFor } from '../game/cosmeticFx';
import { isInMatch, useGameStore } from '../stores/gameStore';
import { reconnectSocket } from '../sockets/client';

const INVENTORY_KEY = ['inventory'];

export const useInventory = () => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  return useQuery({
    queryKey: INVENTORY_KEY,
    queryFn: inventoryApi.getInventory,
    enabled: isAuth && !isGuest,
  });
};

/** Combat effects shown on my side of the duel. */
export const useMyCombatLook = (): CombatLook => {
  const { data } = useInventory();
  return lookFor({
    shoot: data?.equipped?.shoot_anim?.name ?? null,
    shield: data?.equipped?.shield_anim?.name ?? null,
  });
};

/** The server reads combat effects when the socket connects: reconnect so opponents see the new one. */
const refreshCombatFx = (type: CosmeticType) => {
  if (type !== 'shoot_anim' && type !== 'shield_anim') return;
  if (isInMatch(useGameStore.getState().matchStatus)) return;
  reconnectSocket();
};

export const useEquip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.equipItem,
    onSuccess: (equipped) => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEY });
      refreshCombatFx(equipped.type);
    },
  });
};

export const useUnequip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (type: CosmeticType) => inventoryApi.unequipType(type),
    onSuccess: (_data, type) => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEY });
      refreshCombatFx(type);
    },
  });
};
