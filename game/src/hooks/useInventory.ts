import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as inventoryApi from '../api/inventory';
import { useAuthStore } from '../stores/authStore';
import { CosmeticType } from '../api/shop';

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

export const useEquip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.equipItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: INVENTORY_KEY }),
  });
};

export const useUnequip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (type: CosmeticType) => inventoryApi.unequipType(type),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVENTORY_KEY }),
  });
};
