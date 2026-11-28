import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from './events';
import { SocketData } from './auth';
import { createRoom, isUserInRoom } from './gameRoom';
import { isQueued, leaveQueue } from './matchmaking';
import { emitToUser, registeredUser, socketIdsOf } from './hub';
import { socketRef } from './cluster';
import { areFriends, isBlockedEitherWay } from '../services/social.service';
import { logger } from '../lib/logger';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

/** Friend duels: A challenges B, B accepts, a friendly room starts. */

export const CHALLENGE_TTL_MS = 30_000;

interface Challenge {
  fromId: number;
  toId: number;
  timer: NodeJS.Timeout;
}

/** Keyed by `${fromId}:${toId}`. A player can have one outgoing challenge at a time. */
const challenges = new Map<string, Challenge>();
const key = (fromId: number, toId: number) => `${fromId}:${toId}`;

const close = (challenge: Challenge) => {
  clearTimeout(challenge.timer);
  challenges.delete(key(challenge.fromId, challenge.toId));
};

const busy = (userId: number) => isUserInRoom(userId) || isQueued(userId);

/** One of the player's connections, wherever in the cluster it lives. */
const firstSocketOf = (io: TypedServer, userId: number): TypedSocket | undefined => {
  for (const id of socketIdsOf(userId)) {
    const user = registeredUser(userId, id);
    if (user) return socketRef(io, id, user);
  }
  return undefined;
};

export const sendChallenge = async (io: TypedServer, socket: TypedSocket, rawFriendId: unknown) => {
  const user = socket.data.user;
  const friendId = Number(rawFriendId);
  if (!user || !Number.isInteger(friendId) || friendId === user.id) return;

  try {
    if ((await isBlockedEitherWay(user.id, friendId)) || !(await areFriends(user.id, friendId))) {
      return socket.emit('error:message', 'Tu ne peux défier que tes amis.');
    }
  } catch (err) {
    logger.error({ err }, 'challenge: friendship check failed');
    return socket.emit('error:message', 'Défi impossible pour le moment.');
  }

  if (busy(user.id)) return socket.emit('error:message', 'Tu es déjà en partie ou en file.');
  if (socketIdsOf(friendId).length === 0 || busy(friendId)) {
    return socket.emit('challenge:closed', { userId: friendId, reason: 'unavailable' });
  }

  // A new challenge replaces the previous outgoing one.
  for (const existing of [...challenges.values()]) {
    if (existing.fromId === user.id) {
      close(existing);
      emitToUser(existing.toId, 'challenge:closed', { userId: user.id, reason: 'cancelled' });
    }
  }

  const challenge: Challenge = {
    fromId: user.id,
    toId: friendId,
    timer: setTimeout(() => {
      challenges.delete(key(user.id, friendId));
      emitToUser(user.id, 'challenge:closed', { userId: friendId, reason: 'expired' });
      emitToUser(friendId, 'challenge:closed', { userId: user.id, reason: 'expired' });
    }, CHALLENGE_TTL_MS),
  };
  challenges.set(key(user.id, friendId), challenge);
  emitToUser(friendId, 'challenge:received', {
    from: { id: user.id, username: user.username },
    expiresInMs: CHALLENGE_TTL_MS,
  });
};

export const acceptChallenge = (io: TypedServer, socket: TypedSocket, rawFromId: unknown) => {
  const user = socket.data.user;
  const fromId = Number(rawFromId);
  if (!user) return;
  const challenge = challenges.get(key(fromId, user.id));
  if (!challenge) return socket.emit('challenge:closed', { userId: fromId, reason: 'expired' });
  close(challenge);

  const challenger = firstSocketOf(io, fromId);
  if (!challenger || isUserInRoom(fromId) || isUserInRoom(user.id)) {
    return socket.emit('challenge:closed', { userId: fromId, reason: 'unavailable' });
  }

  // Either player may have started searching in the meantime.
  leaveQueue(io, challenger);
  leaveQueue(io, socket);
  createRoom(io, challenger, socket, 'pvp_friendly');
};

export const declineChallenge = (_io: TypedServer, socket: TypedSocket, rawFromId: unknown) => {
  const user = socket.data.user;
  const fromId = Number(rawFromId);
  if (!user) return;
  const challenge = challenges.get(key(fromId, user.id));
  if (!challenge) return;
  close(challenge);
  emitToUser(fromId, 'challenge:closed', { userId: user.id, reason: 'declined' });
};

export const cancelChallenge = (_io: TypedServer, socket: TypedSocket, rawFriendId: unknown) => {
  const user = socket.data.user;
  const friendId = Number(rawFriendId);
  if (!user) return;
  const challenge = challenges.get(key(user.id, friendId));
  if (!challenge) return;
  close(challenge);
  emitToUser(friendId, 'challenge:closed', { userId: user.id, reason: 'cancelled' });
};

/** A player who goes fully offline drops every challenge they are part of. */
export const dropChallengesOf = (userId: number) => {
  for (const challenge of [...challenges.values()]) {
    if (challenge.fromId !== userId && challenge.toId !== userId) continue;
    close(challenge);
    const other = challenge.fromId === userId ? challenge.toId : challenge.fromId;
    emitToUser(other, 'challenge:closed', { userId, reason: 'unavailable' });
  }
};

export const __test = { challenges };
