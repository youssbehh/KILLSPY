import { useQuery } from '@tanstack/react-query';
import * as leaderboardApi from '../api/leaderboard';

export const useLeaderboard = (limit = 10) =>
  useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => leaderboardApi.getLeaderboard(limit),
  });
