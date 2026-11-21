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
import { computeXpReward, levelFromXp } from '../game/progression';
import { logger } from '../lib/logger';

export interface RecordGameInput {
  userId: number;
  outcome: GameOutcome;
  mode: GameMode;
  /** Rounds played, for the history. */
  rounds?: number;
  opponentId?: number;
}

export interface RecordGameResult {
  mmrBefore: number;
  mmrAfter: number;
  delta: number;
  moneyBefore: number;
  moneyAfter: number;
  moneyDelta: number;
  xpDelta: number;
  level: number;
  rank: ReturnType<typeof mmrToRank>;
  historyId: number | null;
}

/** Friendly duels leave no trace; everything else gets a history row. */
const isPersistedMode = (mode: GameMode): mode is 'pve' | 'pvp_quick' | 'pvp_ranked' => mode !== 'pvp_friendly';

/**
 * Record a finished game:
 * - Guests and friendly duels are never persisted.
 * - PvE (training): history row only — no MMR, coins or XP, and it never counts for missions.
 * - PvP Quick: history + coins + XP, MMR untouched.
 * - PvP Ranked: history + coins + XP + MMR.
 */
export const recordGame = async (input: RecordGameInput): Promise<RecordGameResult | null> => {
  const user = await prisma.users.findUnique({
    where: { ID_User: input.userId },
    select: { ID_User: true, MMR: true, Money: true, XP: true, isGuest: true, archived: true },
  });

  if (!user || user.archived) {
    throw new HttpException('Utilisateur introuvable.', ErrCodes.USER_NOT_FOUND, statusCodes.NOT_FOUND, null);
  }

  if (user.isGuest) {
    logger.debug({ userId: user.ID_User }, 'game outcome skipped (guest)');
    return null;
  }

  if (!isPersistedMode(input.mode)) {
    logger.debug({ userId: user.ID_User, mode: input.mode }, 'friendly outcome skipped (no persistence)');
    return null;
  }

  const delta = computeMmrDelta(input.outcome, input.mode);
  const mmrAfter = applyMmrDelta(user.MMR, delta);
  const moneyDelta = computeMoneyReward(input.outcome, input.mode);
  const moneyAfter = user.Money + moneyDelta;
  const xpDelta = computeXpReward(input.outcome, input.mode);

  const [, history] = await prisma.$transaction([
    prisma.users.update({
      where: { ID_User: user.ID_User },
      // Money is incremented atomically so concurrent rewards/purchases never overwrite each other.
      data: { MMR: mmrAfter, Money: { increment: moneyDelta }, XP: { increment: xpDelta } },
    }),
    prisma.gameHistory.create({
      data: {
        ID_User: user.ID_User,
        V_D: input.outcome === 'won',
        Draw: input.outcome === 'draw',
        Rounds: input.rounds ?? 0,
        OpponentId: input.opponentId ?? null,
        DateGame: new Date(),
        MMRWin: delta,
        XPWin: xpDelta,
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
    xpDelta,
    level: levelFromXp(user.XP + xpDelta),
    rank: mmrToRank(mmrAfter),
    historyId: history.ID_GameHistory,
  };
};

export interface ModeStats {
  wins: number;
  losses: number;
  draws: number;
  total: number;
  winRate: number;
}

export interface HistoryEntry {
  id: number;
  won: boolean;
  date: Date;
  draw: boolean;
  rounds: number;
  mmrDelta: number;
  xpDelta: number;
  mode: 'pve' | 'pvp_quick' | 'pvp_ranked';
  opponent: string | null;
}

const computeStats = (wins: number, draws: number, total: number): ModeStats => ({
  wins,
  draws,
  losses: total - wins - draws,
  total,
  winRate: total === 0 ? 0 : wins / total,
});

type HistoryRow = {
  ID_GameHistory: number; V_D: boolean; Draw: boolean; Rounds: number; DateGame: Date;
  MMRWin: number; XPWin: number; Mode: 'pve' | 'pvp_quick' | 'pvp_ranked'; OpponentId: number | null;
};

const HISTORY_SELECT = {
  ID_GameHistory: true, V_D: true, Draw: true, Rounds: true, DateGame: true,
  MMRWin: true, XPWin: true, Mode: true, OpponentId: true,
} as const;

const toHistoryEntries = async (rows: HistoryRow[]): Promise<HistoryEntry[]> => {
  const opponentIds = [...new Set(rows.map((r) => r.OpponentId).filter((id): id is number => id !== null))];
  const opponents = opponentIds.length
    ? await prisma.users.findMany({ where: { ID_User: { in: opponentIds } }, select: { ID_User: true, Username: true } })
    : [];
  const nameBy = new Map(opponents.map((o) => [o.ID_User, o.Username]));
  return rows.map((g) => ({
    id: g.ID_GameHistory,
    won: g.V_D,
    draw: g.Draw,
    rounds: g.Rounds,
    date: g.DateGame,
    mmrDelta: g.MMRWin,
    xpDelta: g.XPWin,
    mode: g.Mode,
    opponent: g.OpponentId === null ? null : nameBy.get(g.OpponentId) ?? null,
  }));
};

/** One page of the player's match history, newest first. */
export const getUserHistory = async (userId: number, offset: number, limit: number) => {
  const rows = await prisma.gameHistory.findMany({
    where: { ID_User: userId },
    orderBy: { DateGame: 'desc' },
    skip: offset,
    take: limit + 1,
    select: HISTORY_SELECT,
  });
  return {
    hasMore: rows.length > limit,
    games: await toHistoryEntries(rows.slice(0, limit) as HistoryRow[]),
  };
};

/**
 * Aggregate stats split by mode. PvE is never represented (not persisted).
 */
export const getUserStats = async (userId: number) => {
  const count = (mode: 'pvp_quick' | 'pvp_ranked', extra: { V_D?: boolean; Draw?: boolean } = {}) =>
    prisma.gameHistory.count({ where: { ID_User: userId, Mode: mode, ...extra } });

  const [user, quickWins, quickDraws, quickTotal, rankedWins, rankedDraws, rankedTotal, recent] = await Promise.all([
    prisma.users.findUnique({
      where: { ID_User: userId },
      select: { ID_User: true, Username: true, MMR: true, Money: true, XP: true, CreatedAt: true },
    }),
    count('pvp_quick', { V_D: true }),
    count('pvp_quick', { Draw: true }),
    count('pvp_quick'),
    count('pvp_ranked', { V_D: true }),
    count('pvp_ranked', { Draw: true }),
    count('pvp_ranked'),
    prisma.gameHistory.findMany({
      where: { ID_User: userId },
      orderBy: { DateGame: 'desc' },
      take: 10,
      select: HISTORY_SELECT,
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
      xp: user.XP,
      level: levelFromXp(user.XP),
      since: user.CreatedAt,
    },
    rank: mmrToRank(user.MMR),
    stats: {
      quick: computeStats(quickWins, quickDraws, quickTotal),
      ranked: computeStats(rankedWins, rankedDraws, rankedTotal),
    },
    recentGames: await toHistoryEntries(recent as HistoryRow[]),
  };
};

const RANKED = { isGuest: false, archived: false, banned: false } as const;

export const getLeaderboardTop = async (limit = 10, offset = 0) => {
  const users = await prisma.users.findMany({
    where: RANKED,
    orderBy: [{ MMR: 'desc' }, { ID_User: 'asc' }],
    skip: offset,
    take: limit,
    select: { ID_User: true, Username: true, MMR: true },
  });

  return users.map((u, idx) => ({
    position: offset + idx + 1,
    userId: u.ID_User,
    username: u.Username,
    mmr: u.MMR,
    rank: mmrToRank(u.MMR),
  }));
};

/** The caller's own position, wherever it is in the ladder. */
export const getLeaderboardPosition = async (userId: number) => {
  const me = await prisma.users.findUnique({
    where: { ID_User: userId },
    select: { ID_User: true, Username: true, MMR: true, isGuest: true },
  });
  if (!me || me.isGuest) return null;
  const ahead = await prisma.users.count({
    where: {
      ...RANKED,
      OR: [{ MMR: { gt: me.MMR } }, { MMR: me.MMR, ID_User: { lt: me.ID_User } }],
    },
  });
  return { position: ahead + 1, userId: me.ID_User, username: me.Username, mmr: me.MMR, rank: mmrToRank(me.MMR) };
};
