import { prisma } from '../lib/prisma';
import { HttpException, ErrCodes, statusCodes } from '../utils/exceptions';
import {
  GameMode,
  GameOutcome,
  applyMmrDelta,
  computeMmrDelta,
  mmrToRank,
} from '../game/ranking';
import { computeMoneyReward } from '../game/economy';
import { logger } from '../lib/logger';

export interface RecordGameInput {
  userId: number;
  outcome: GameOutcome;
  mode: GameMode;
}

export interface RecordGameResult {
  mmrBefore: number;
  mmrAfter: number;
  delta: number;
  moneyBefore: number;
  moneyAfter: number;
  moneyDelta: number;
  rank: ReturnType<typeof mmrToRank>;
  historyId: number | null;
}

const isPersistedMode = (mode: GameMode): mode is 'pvp_quick' | 'pvp_ranked' =>
  mode === 'pvp_quick' || mode === 'pvp_ranked';

/**
 * Record a finished game:
 * - PvE games are NOT persisted (training mode, no trace).
 * - Guests don't persist anything.
 * - PvP Quick: writes GameHistory (Mode=pvp_quick) with MMR delta = 0.
 * - PvP Ranked: writes GameHistory (Mode=pvp_ranked) and updates user MMR.
 */
export const recordGame = async (input: RecordGameInput): Promise<RecordGameResult | null> => {
  const user = await prisma.users.findUnique({
    where: { ID_User: input.userId },
    select: { ID_User: true, MMR: true, Money: true, isGuest: true, archived: true },
  });

  if (!user || user.archived) {
    throw new HttpException('Utilisateur introuvable.', ErrCodes.USER_NOT_FOUND, statusCodes.NOT_FOUND, null);
  }

  if (user.isGuest) {
    logger.debug({ userId: user.ID_User }, 'game outcome skipped (guest)');
    return null;
  }

  if (!isPersistedMode(input.mode)) {
    logger.debug({ userId: user.ID_User, mode: input.mode }, 'PvE outcome skipped (no persistence)');
    return null;
  }

  const delta = computeMmrDelta(input.outcome, input.mode);
  const mmrAfter = applyMmrDelta(user.MMR, delta);
  const moneyDelta = computeMoneyReward(input.outcome, input.mode);
  const moneyAfter = user.Money + moneyDelta;

  const [, history] = await prisma.$transaction([
    prisma.users.update({
      where: { ID_User: user.ID_User },
      data: { MMR: mmrAfter, Money: moneyAfter },
    }),
    prisma.gameHistory.create({
      data: {
        ID_User: user.ID_User,
        V_D: input.outcome === 'won',
        DateGame: new Date(),
        MMRWin: delta,
        Mode: input.mode,
      },
    }),
  ]);

  return {
    mmrBefore: user.MMR,
    mmrAfter,
    delta,
    moneyBefore: user.Money,
    moneyAfter,
    moneyDelta,
    rank: mmrToRank(mmrAfter),
    historyId: history.ID_GameHistory,
  };
};

export interface ModeStats {
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export interface HistoryEntry {
  id: number;
  won: boolean;
  date: Date;
  mmrDelta: number;
  mode: 'pvp_quick' | 'pvp_ranked';
}

const emptyStats = (): ModeStats => ({ wins: 0, losses: 0, total: 0, winRate: 0 });
const computeStats = (wins: number, losses: number): ModeStats => {
  const total = wins + losses;
  return { wins, losses, total, winRate: total === 0 ? 0 : wins / total };
};

/**
 * Aggregate stats split by mode. PvE is never represented (not persisted).
 */
export const getUserStats = async (userId: number) => {
  const [user, quickWins, quickLosses, rankedWins, rankedLosses, recent] = await Promise.all([
    prisma.users.findUnique({
      where: { ID_User: userId },
      select: { ID_User: true, Username: true, MMR: true, Money: true, CreatedAt: true },
    }),
    prisma.gameHistory.count({ where: { ID_User: userId, Mode: 'pvp_quick', V_D: true } }),
    prisma.gameHistory.count({ where: { ID_User: userId, Mode: 'pvp_quick', V_D: false } }),
    prisma.gameHistory.count({ where: { ID_User: userId, Mode: 'pvp_ranked', V_D: true } }),
    prisma.gameHistory.count({ where: { ID_User: userId, Mode: 'pvp_ranked', V_D: false } }),
    prisma.gameHistory.findMany({
      where: { ID_User: userId },
      orderBy: { DateGame: 'desc' },
      take: 10,
      select: { ID_GameHistory: true, V_D: true, DateGame: true, MMRWin: true, Mode: true },
    }),
  ]);

  if (!user) {
    throw new HttpException('Utilisateur introuvable.', ErrCodes.USER_NOT_FOUND, statusCodes.NOT_FOUND, null);
  }

  return {
    user: {
      id: user.ID_User,
      username: user.Username,
      mmr: user.MMR,
      money: user.Money,
      since: user.CreatedAt,
    },
    rank: mmrToRank(user.MMR),
    stats: {
      quick: computeStats(quickWins, quickLosses),
      ranked: computeStats(rankedWins, rankedLosses),
    },
    recentGames: recent.map<HistoryEntry>((g) => ({
      id: g.ID_GameHistory,
      won: g.V_D,
      date: g.DateGame,
      mmrDelta: g.MMRWin,
      mode: g.Mode as 'pvp_quick' | 'pvp_ranked',
    })),
  };
};

export const getLeaderboardTop = async (limit = 10) => {
  const users = await prisma.users.findMany({
    where: { isGuest: false, archived: false },
    orderBy: { MMR: 'desc' },
    take: limit,
    select: { ID_User: true, Username: true, MMR: true },
  });

  return users.map((u, idx) => ({
    position: idx + 1,
    userId: u.ID_User,
    username: u.Username,
    mmr: u.MMR,
    rank: mmrToRank(u.MMR),
  }));
};
