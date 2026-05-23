import { apiClient } from './client';
import { RankTier } from '../game/ranking';

export interface LeaderboardEntry {
  position: number;
  userId: number;
  username: string;
  mmr: number;
  rank: RankTier;
}

/**
 * Legacy compat: old screens used `entry.User.Username` etc.
 * We expose the new shape and the screens are updated to consume it.
 */
export const getLeaderboard = async (limit = 10): Promise<LeaderboardEntry[]> => {
  const { data } = await apiClient.get<{ leaderboard: LeaderboardEntry[] }>(
    `/leaderboard?limit=${limit}`,
  );
  return data.leaderboard;
};
