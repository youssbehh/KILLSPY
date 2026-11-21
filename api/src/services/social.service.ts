import { prisma } from '../lib/prisma';
import { HttpException, ErrCodes, statusCodes } from '../utils/exceptions';
import { disconnectUser, emitToUser, isOnline } from '../sockets/hub';
import { mmrToRank } from '../game/ranking';
import { levelFromXp } from '../game/progression';

export type Relation = 'self' | 'none' | 'friend' | 'incoming' | 'outgoing' | 'blocked' | 'blocked_by';

export interface PlayerSummary {
  id: number;
  username: string;
  mmr: number;
  online: boolean;
}

const fail = (message: string, status: statusCodes, code: ErrCodes = ErrCodes.BAD_REQUEST) =>
  new HttpException(message, code, status, null);

const summary = (u: { ID_User: number; Username: string; MMR: number }): PlayerSummary => ({
  id: u.ID_User,
  username: u.Username,
  mmr: u.MMR,
  online: isOnline(u.ID_User),
});

const USER_FIELDS = { ID_User: true, Username: true, MMR: true } as const;

/** The friendship/request row between two players, whichever side created it. */
const findLink = (a: number, b: number) =>
  prisma.friends.findFirst({
    where: { OR: [{ ID_User: a, ID_Friend: b }, { ID_User: b, ID_Friend: a }] },
  });

export const isBlockedEitherWay = async (a: number, b: number): Promise<boolean> => {
  const block = await prisma.block.findFirst({
    where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
  });
  return block !== null;
};

export const areFriends = async (a: number, b: number): Promise<boolean> => {
  const link = await findLink(a, b);
  return link?.Status === 'accepted';
};

export const relationBetween = async (me: number, other: number): Promise<Relation> => {
  if (me === other) return 'self';
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: me, blockedId: other }, { blockerId: other, blockedId: me }] },
  });
  if (blocks.some((b) => b.blockerId === me)) return 'blocked';
  if (blocks.length > 0) return 'blocked_by';
  const link = await findLink(me, other);
  if (!link) return 'none';
  if (link.Status === 'accepted') return 'friend';
  return link.ID_User === me ? 'outgoing' : 'incoming';
};

// ── Friend requests ─────────────────────────────────────────────────────────

export const sendFriendRequest = async (userId: number, isGuest: boolean, username: string) => {
  if (isGuest) throw fail('Crée un compte pour ajouter des amis.', statusCodes.FORBIDDEN, ErrCodes.IS_GUEST);

  const target = await prisma.users.findFirst({
    where: { Username: { equals: username, mode: 'insensitive' }, isGuest: false, archived: false },
    select: USER_FIELDS,
  });
  // A player who blocked you looks exactly like a player who does not exist.
  if (!target || target.ID_User === userId || (await isBlockedEitherWay(userId, target.ID_User))) {
    throw fail('Utilisateur introuvable !', statusCodes.NOT_FOUND, ErrCodes.USER_NOT_FOUND);
  }

  const link = await findLink(userId, target.ID_User);
  if (link?.Status === 'accepted') {
    throw fail('Vous êtes déjà amis.', statusCodes.BAD_REQUEST, ErrCodes.FRIEND_ALREADY_EXISTS);
  }
  if (link && link.ID_User === userId) {
    throw fail('Demande déjà envoyée.', statusCodes.BAD_REQUEST, ErrCodes.FRIEND_ALREADY_EXISTS);
  }

  // The other player had already asked: sending a request back accepts theirs.
  if (link) {
    await prisma.friends.update({ where: { ID_Friendship: link.ID_Friendship }, data: { Status: 'accepted' } });
    emitToUser(target.ID_User, 'social:update', { kind: 'friends' });
    return { status: 'accepted' as const, user: summary(target) };
  }

  await prisma.friends.create({ data: { ID_User: userId, ID_Friend: target.ID_User, Status: 'pending' } });
  emitToUser(target.ID_User, 'social:update', { kind: 'friends' });
  return { status: 'pending' as const, user: summary(target) };
};

export const acceptFriendRequest = async (userId: number, requestId: number) => {
  const accepted = await prisma.friends.updateMany({
    where: { ID_Friendship: requestId, ID_Friend: userId, Status: 'pending' },
    data: { Status: 'accepted' },
  });
  if (accepted.count !== 1) throw fail('Demande introuvable.', statusCodes.NOT_FOUND);
  const link = await prisma.friends.findUnique({ where: { ID_Friendship: requestId } });
  if (link) emitToUser(link.ID_User, 'social:update', { kind: 'friends' });
};

/** Declines an incoming request or cancels an outgoing one. */
export const deleteFriendRequest = async (userId: number, requestId: number) => {
  const link = await prisma.friends.findUnique({ where: { ID_Friendship: requestId } });
  if (!link || link.Status !== 'pending' || (link.ID_User !== userId && link.ID_Friend !== userId)) {
    throw fail('Demande introuvable.', statusCodes.NOT_FOUND);
  }
  await prisma.friends.delete({ where: { ID_Friendship: requestId } });
  emitToUser(link.ID_User === userId ? link.ID_Friend : link.ID_User, 'social:update', { kind: 'friends' });
};

export const removeFriend = async (userId: number, otherId: number) => {
  const link = await findLink(userId, otherId);
  if (!link || link.Status !== 'accepted') throw fail('Ami introuvable.', statusCodes.NOT_FOUND, ErrCodes.FRIENDS_NOT_FOUND);
  await prisma.friends.delete({ where: { ID_Friendship: link.ID_Friendship } });
  emitToUser(otherId, 'social:update', { kind: 'friends' });
};

export const listFriends = async (userId: number) => {
  const links = await prisma.friends.findMany({
    where: { OR: [{ ID_User: userId }, { ID_Friend: userId }] },
    include: { User: { select: USER_FIELDS }, Friend: { select: USER_FIELDS } },
    orderBy: { CreatedAt: 'desc' },
  });

  const friends: PlayerSummary[] = [];
  const incoming: { requestId: number; user: PlayerSummary; createdAt: Date }[] = [];
  const outgoing: { requestId: number; user: PlayerSummary; createdAt: Date }[] = [];

  for (const link of links) {
    const mine = link.ID_User === userId;
    const other = summary(mine ? link.Friend : link.User);
    if (link.Status === 'accepted') friends.push(other);
    else (mine ? outgoing : incoming).push({ requestId: link.ID_Friendship, user: other, createdAt: link.CreatedAt });
  }

  // Online friends first, then by rating.
  friends.sort((a, b) => Number(b.online) - Number(a.online) || b.mmr - a.mmr);
  return { friends, incoming, outgoing };
};

// ── Blocking ────────────────────────────────────────────────────────────────

export const blockUser = async (userId: number, targetId: number) => {
  if (userId === targetId) throw fail('Action impossible.', statusCodes.BAD_REQUEST);
  const target = await prisma.users.findUnique({ where: { ID_User: targetId }, select: { ID_User: true } });
  if (!target) throw fail('Utilisateur introuvable !', statusCodes.NOT_FOUND, ErrCodes.USER_NOT_FOUND);

  // Blocking also ends the friendship and drops any pending request, both ways.
  await prisma.$transaction([
    prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } },
      update: {},
      create: { blockerId: userId, blockedId: targetId },
    }),
    prisma.friends.deleteMany({
      where: { OR: [{ ID_User: userId, ID_Friend: targetId }, { ID_User: targetId, ID_Friend: userId }] },
    }),
  ]);
  emitToUser(targetId, 'social:update', { kind: 'friends' });
};

export const unblockUser = async (userId: number, targetId: number) => {
  await prisma.block.deleteMany({ where: { blockerId: userId, blockedId: targetId } });
};

export const listBlocked = async (userId: number) => {
  const blocks = await prisma.block.findMany({
    where: { blockerId: userId },
    include: { blocked: { select: { ID_User: true, Username: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return blocks.map((b) => ({ id: b.blocked.ID_User, username: b.blocked.Username }));
};

// ── Search & public profile ─────────────────────────────────────────────────

export const searchPlayers = async (userId: number, query: string) => {
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const hidden = new Set<number>([userId, ...blocks.flatMap((b) => [b.blockerId, b.blockedId])]);

  const users = await prisma.users.findMany({
    where: {
      Username: { contains: query, mode: 'insensitive' },
      isGuest: false,
      archived: false,
      banned: false,
      ID_User: { notIn: [...hidden] },
    },
    select: USER_FIELDS,
    orderBy: { MMR: 'desc' },
    take: 20,
  });

  return Promise.all(
    users.map(async (u) => ({ ...summary(u), relation: await relationBetween(userId, u.ID_User) })),
  );
};

export const getPublicProfile = async (viewerId: number, targetId: number) => {
  const relation = await relationBetween(viewerId, targetId);
  const user = await prisma.users.findUnique({
    where: { ID_User: targetId },
    select: {
      ID_User: true, Username: true, MMR: true, XP: true, CreatedAt: true, isGuest: true, archived: true,
      GuildMembership: { select: { role: true, guild: { select: { id: true, name: true, tag: true } } } },
    },
  });
  if (!user || user.archived || user.isGuest || relation === 'blocked_by') {
    throw fail('Utilisateur introuvable !', statusCodes.NOT_FOUND, ErrCodes.USER_NOT_FOUND);
  }

  const [wins, total] = await Promise.all([
    prisma.gameHistory.count({ where: { ID_User: targetId, V_D: true, Mode: { not: 'pve' } } }),
    prisma.gameHistory.count({ where: { ID_User: targetId, Mode: { not: 'pve' } } }),
  ]);

  return {
    id: user.ID_User,
    username: user.Username,
    mmr: user.MMR,
    rank: mmrToRank(user.MMR),
    xp: user.XP,
    level: levelFromXp(user.XP),
    since: user.CreatedAt,
    online: isOnline(user.ID_User),
    stats: { wins, losses: total - wins, total, winRate: total === 0 ? 0 : wins / total },
    guild: user.GuildMembership
      ? { ...user.GuildMembership.guild, role: user.GuildMembership.role }
      : null,
    relation,
  };
};

// ── Reports & moderation ────────────────────────────────────────────────────

export const REPORT_REASONS = ['cheating', 'harassment', 'offensive_name', 'spam', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const reportPlayer = async (reporterId: number, targetId: number, reason: ReportReason, details?: string) => {
  if (reporterId === targetId) throw fail('Action impossible.', statusCodes.BAD_REQUEST);
  const target = await prisma.users.findUnique({ where: { ID_User: targetId }, select: { ID_User: true } });
  if (!target) throw fail('Utilisateur introuvable !', statusCodes.NOT_FOUND, ErrCodes.USER_NOT_FOUND);

  // One open report per (reporter, target): repeated taps do not flood moderators.
  const existing = await prisma.report.findFirst({ where: { reporterId, targetId, status: 'open' } });
  if (existing) return { id: existing.id };

  const report = await prisma.report.create({ data: { reporterId, targetId, reason, details } });
  return { id: report.id };
};

export const listReports = async (status: 'open' | 'resolved', offset: number, limit: number) => {
  const reports = await prisma.report.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
    include: {
      reporter: { select: { ID_User: true, Username: true } },
      target: { select: { ID_User: true, Username: true, banned: true } },
    },
  });
  return reports.map((r) => ({
    id: r.id,
    reason: r.reason,
    details: r.details,
    status: r.status,
    createdAt: r.createdAt,
    reporter: { id: r.reporter.ID_User, username: r.reporter.Username },
    target: { id: r.target.ID_User, username: r.target.Username, banned: r.target.banned },
  }));
};

export const resolveReport = async (reportId: number) => {
  const done = await prisma.report.updateMany({ where: { id: reportId }, data: { status: 'resolved' } });
  if (done.count !== 1) throw fail('Signalement introuvable.', statusCodes.NOT_FOUND);
};

export const setBanned = async (targetId: number, banned: boolean) => {
  const done = await prisma.users.updateMany({
    where: { ID_User: targetId },
    // Banning also closes every open session of the player.
    data: banned ? { banned: true, tokenVersion: { increment: 1 } } : { banned: false },
  });
  if (done.count !== 1) throw fail('Utilisateur introuvable !', statusCodes.NOT_FOUND, ErrCodes.USER_NOT_FOUND);
  // The REST token is revoked above; this also cuts the live socket (chat, match in progress).
  if (banned) disconnectUser(targetId);
};
