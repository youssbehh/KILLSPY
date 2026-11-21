import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as shopApi from '../api/shop';
import { useAuthStore } from '../stores/authStore';

const SHOP_KEY = ['shop'];

export const useShop = () => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: SHOP_KEY,
    queryFn: shopApi.getShop,
    enabled: isAuth,
  });
};

export const usePurchase = () => {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: shopApi.purchaseOffer,
    onSuccess: (result) => {
      updateUser({ money: result.moneyAfter });
      qc.invalidateQueries({ queryKey: SHOP_KEY });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });
};
