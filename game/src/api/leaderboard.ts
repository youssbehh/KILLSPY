import { apiClient } from './client';
import { RankTier } from '../game/ranking';

export interface LeaderboardEntry {
  position: number;
  userId: number;
  username: string;
  mmr: number;
  rank: RankTier;
}

export interface LeaderboardPage {
  leaderboard: LeaderboardEntry[];
  hasMore: boolean;
}

export const getLeaderboardPage = async (limit = 10, offset = 0): Promise<LeaderboardPage> => {
  const { data } = await apiClient.get<LeaderboardPage>('/leaderboard', { params: { limit, offset } });
  return data;
};

export const getLeaderboard = async (limit = 10): Promise<LeaderboardEntry[]> =>
  (await getLeaderboardPage(limit)).leaderboard;

/** My own position, wherever it is in the ladder. Null for guests. */
export const getMyLeaderboardPosition = async (): Promise<LeaderboardEntry | null> => {
  const { data } = await apiClient.get<{ me: LeaderboardEntry | null }>('/leaderboard/me');
  return data.me;
};
