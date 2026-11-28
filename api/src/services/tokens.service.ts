import jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { Users } from '@prisma/client';

import { prisma } from '../lib/prisma';
import { JWT_SECRET } from '../secrets';
import { HttpException, ErrCodes, statusCodes } from '../utils/exceptions';
import { logger } from '../lib/logger';

/**
 * Two tokens per session:
 * - the access token, a JWT sent with every request, short-lived;
 * - the refresh token, an opaque random string only used to get a new pair.
 *
 * Each refresh replaces the refresh token by a new one of the same "family".
 * A replaced token presented again means it leaked (or two devices share it):
 * the whole family is revoked and the player has to log in again.
 */
export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/**
 * Two refreshes fired at the same time by one device (REST call + socket reconnect)
 * both present the same token: the late one inside this window is not treated as theft.
 */
const REUSE_GRACE_MS = 10_000;

export type SessionTokens = { token: string; refreshToken: string };

const hashToken = (raw: string) => createHash('sha256').update(raw).digest('hex');

/** `v` is the user's tokenVersion: bumping it server-side revokes every older token. */
export const signAccessToken = (userId: number, tokenVersion: number) =>
  jwt.sign({ id: userId, v: tokenVersion }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

const createRefreshToken = async (user: Pick<Users, 'ID_User' | 'tokenVersion'>, familyId: string) => {
  const raw = randomBytes(48).toString('base64url');
  await prisma.refreshToken.create({
    data: {
      userId: user.ID_User,
      tokenHash: hashToken(raw),
      familyId,
      tokenVersion: user.tokenVersion,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  return raw;
};

/** Opens a new session (login, guest, signup upgrade, password change). */
export const issueSession = async (user: Pick<Users, 'ID_User' | 'tokenVersion'>): Promise<SessionTokens> => ({
  token: signAccessToken(user.ID_User, user.tokenVersion),
  refreshToken: await createRefreshToken(user, randomUUID()),
});

const expired = () =>
  new HttpException('Session expirée, reconnecte-toi.', ErrCodes.SESSION_EXPIRED, statusCodes.UNAUTHORIZED, null);

/** Trades a refresh token for a new access token and a new refresh token. */
export const refreshSession = async (rawRefreshToken: string): Promise<SessionTokens> => {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawRefreshToken) },
    include: { user: true },
  });
  if (!stored) throw expired();

  const { user } = stored;
  const now = Date.now();

  if (stored.revokedAt) throw expired();

  if (stored.replacedAt && now - stored.replacedAt.getTime() > REUSE_GRACE_MS) {
    // Replayed long after being replaced: treat as stolen and close every session of that family.
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    logger.warn({ userId: user.ID_User, familyId: stored.familyId }, 'refresh token reuse: family revoked');
    throw expired();
  }

  if (
    stored.expiresAt.getTime() <= now ||
    stored.tokenVersion !== user.tokenVersion ||
    user.archived ||
    user.banned
  ) {
    throw expired();
  }

  if (!stored.replacedAt) {
    // A concurrent call may have rotated it in between: it is then inside the grace window too.
    await prisma.refreshToken.updateMany({
      where: { id: stored.id, replacedAt: null },
      data: { replacedAt: new Date() },
    });
  }
  // A player who only ever refreshes is still active (idle guests are purged on this date).
  await prisma.session.updateMany({ where: { ID_User: user.ID_User }, data: { LastConnection: new Date() } });

  return {
    token: signAccessToken(user.ID_User, user.tokenVersion),
    refreshToken: await createRefreshToken(user, stored.familyId),
  };
};

/** Logout, or the end of every session at once. */
export const revokeAllSessions = async (userId: number) => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

/**
 * Housekeeping: expired tokens, and tokens replaced or revoked more than a day ago
 * (long enough for reuse detection to have caught a replay).
 */
export const purgeRefreshTokens = async () => {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { count } = await prisma.refreshToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { lt: dayAgo } }, { replacedAt: { lt: dayAgo } }],
    },
  });
  return count;
};
