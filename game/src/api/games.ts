import { apiClient } from './client';
import { GameOutcome, RankTier } from '../game/ranking';

export interface RecordGameResult {
  mmrBefore: number;
  mmrAfter: number;
  delta: number;
  moneyDelta: number;
  xpDelta: number;
  level: number;
  rank: RankTier;
  historyId: number | null;
}

/**
 * Reports a finished training game. Only 'pve' can be declared by the client:
 * it lands in the history, with no reward. PvP results are recorded by the server.
 */
export const postTrainingResult = async (input: {
  outcome: GameOutcome;
  rounds?: number;
}): Promise<RecordGameResult | null> => {
  const { data } = await apiClient.post<{ result: RecordGameResult | null }>('/games/result', {
    ...input,
    mode: 'pve',
  });
  return data.result;
};

export type HistoryMode = 'pve' | 'pvp_quick' | 'pvp_ranked';

export interface ModeStats {
  wins: number;
  losses: number;
  draws: number;
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
  draw: boolean;
  rounds: number;
  date: string;
  mmrDelta: number;
  xpDelta: number;
  mode: HistoryMode;
  /** Opponent's username; null for training games or a deleted account. */
  opponent: string | null;
}

export interface UserStats {
  user: { id: number; username: string; mmr: number; money: number; xp: number; level: number; since: string };
  stats: SplitStats;
  rank: RankTier;
  /** The 10 latest games, newest first. */
  recentGames: GameHistoryItem[];
}

export interface HistoryPage {
  /** Newest first. */
  games: GameHistoryItem[];
  hasMore: boolean;
}

export const HISTORY_PAGE_SIZE = 20;

export const getMyStats = async (): Promise<UserStats> => {
  const { data } = await apiClient.get<UserStats>('/games/me/stats');
  return data;
};

export const getMyHistory = async (offset = 0): Promise<HistoryPage> => {
  const { data } = await apiClient.get<HistoryPage>('/games/me/history', {
    params: { offset, limit: HISTORY_PAGE_SIZE },
  });
  return data;
};
