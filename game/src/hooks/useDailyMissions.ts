import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as missionsApi from '../api/missions';
import { useAuthStore } from '../stores/authStore';

const KEY = ['missions', 'daily'];

export const useDailyMissions = () => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  return useQuery({
    queryKey: KEY,
    queryFn: missionsApi.getDailyMissions,
    enabled: isAuth && !isGuest,
    staleTime: 60_000,
  });
};

export const useClaimMission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: missionsApi.claimDailyMission,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
};
