import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as gamesApi from '../api/games';
import { GameHistoryItem, HistoryPage, HISTORY_PAGE_SIZE } from '../api/games';
import { useAuthStore } from '../stores/authStore';

const STATS_KEY = ['games', 'me', 'stats'];
const HISTORY_KEY = ['games', 'me', 'history'];

const useIsAccount = () => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  return isAuth && !isGuest;
};

/** Win/draw/loss per mode, rank, and the 10 latest games. */
export const useMyStats = () => {
  const enabled = useIsAccount();
  return useQuery({ queryKey: STATS_KEY, queryFn: gamesApi.getMyStats, enabled });
};

/** Full match history, newest first, page by page. `games` is the flattened list. */
export const useMyHistory = () => {
  const enabled = useIsAccount();
  const query = useInfiniteQuery({
    queryKey: HISTORY_KEY,
    queryFn: ({ pageParam }: { pageParam: number }) => gamesApi.getMyHistory(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage: HistoryPage, allPages: HistoryPage[]) =>
      lastPage.hasMore ? allPages.length * HISTORY_PAGE_SIZE : undefined,
    enabled,
  });
  const pages: HistoryPage[] = query.data?.pages ?? [];
  const games: GameHistoryItem[] = pages.flatMap((p) => p.games);
  return { ...query, games };
};

/** Saves a finished game against the bot in the history (no reward). Silent for guests. */
export const useRecordTrainingGame = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: gamesApi.postTrainingResult,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
  });
};
