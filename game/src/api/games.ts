import { apiClient } from './client';
import { GameMode, GameOutcome, RankTier } from '../game/ranking';

export interface RecordGameResult {
  mmrBefore: number;
  mmrAfter: number;
  delta: number;
  rank: RankTier;
  historyId: number | null;
}

export const postGameResult = async (input: {
  outcome: GameOutcome;
  mode: GameMode;
}): Promise<RecordGameResult | null> => {
  const { data } = await apiClient.post<{ result: RecordGameResult | null }>('/games/result', input);
  return data.result;
};

export type PersistedMode = 'pvp_quick' | 'pvp_ranked';

export interface ModeStats {
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export interface SplitStats {
  quick: ModeStats;
  ranked: ModeStats;
}

export interface GameHistoryItem {
  id: number;
  won: boolean;
  date: string;
  mmrDelta: number;
  mode: PersistedMode;
}

export interface UserStats {
  user: { id: number; username: string; mmr: number; since: string };
  stats: SplitStats;
  rank: RankTier;
  recentGames: GameHistoryItem[];
}

export const getMyStats = async (): Promise<UserStats> => {
  const { data } = await apiClient.get<UserStats>('/games/me/stats');
  return data;
};

export const getMyHistory = async (): Promise<{
  recentGames: GameHistoryItem[];
  stats: SplitStats;
}> => {
  const { data } = await apiClient.get<{ recentGames: GameHistoryItem[]; stats: SplitStats }>(
    '/games/me/history',
  );
  return data;
};
