import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import * as leaderboardApi from '../api/leaderboard';
import { LeaderboardEntry, LeaderboardPage } from '../api/leaderboard';
import { useAuthStore } from '../stores/authStore';

const PAGE_SIZE = 25;

/** The first `limit` players (Home teaser, podium). */
export const useLeaderboard = (limit = 10) =>
  useQuery({
    queryKey: ['leaderboard', 'top', limit],
    queryFn: () => leaderboardApi.getLeaderboard(limit),
  });

/** The whole ladder, page by page. `entries` is the flattened list. */
export const useLeaderboardPages = () => {
  const query = useInfiniteQuery({
    queryKey: ['leaderboard', 'pages'],
    queryFn: ({ pageParam }: { pageParam: number }) => leaderboardApi.getLeaderboardPage(PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage: LeaderboardPage, allPages: LeaderboardPage[]) =>
      lastPage.hasMore ? allPages.length * PAGE_SIZE : undefined,
  });
  const pages: LeaderboardPage[] = query.data?.pages ?? [];
  const entries: LeaderboardEntry[] = pages.flatMap((p) => p.leaderboard);
  return { ...query, entries };
};

/** My own position, even far outside the loaded pages. Null for guests. */
export const useMyLeaderboardPosition = () => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  return useQuery({
    queryKey: ['leaderboard', 'me'],
    queryFn: leaderboardApi.getMyLeaderboardPosition,
    enabled: isAuth && !isGuest,
  });
};
