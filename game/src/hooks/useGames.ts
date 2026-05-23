import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as gamesApi from '../api/games';
import { useAuthStore } from '../stores/authStore';

const STATS_KEY = ['games', 'me', 'stats'];
const HISTORY_KEY = ['games', 'me', 'history'];

export const useMyStats = () => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  return useQuery({
    queryKey: STATS_KEY,
    queryFn: gamesApi.getMyStats,
    enabled: isAuth && !isGuest,
  });
};

export const useMyHistory = () => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  return useQuery({
    queryKey: HISTORY_KEY,
    queryFn: gamesApi.getMyHistory,
    enabled: isAuth && !isGuest,
  });
};

export const useRecordGame = () => {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: gamesApi.postGameResult,
    onSuccess: (result) => {
      if (result) updateUser({ mmr: result.mmrAfter });
      qc.invalidateQueries({ queryKey: STATS_KEY });
      qc.invalidateQueries({ queryKey: HISTORY_KEY });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
};
