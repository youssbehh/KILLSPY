import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, QueueMode, ServerToClientEvents } from './events';
import { SocketData } from './auth';
import { createRoom, isSocketInRoom, isUserInRoom } from './gameRoom';
import { logger } from '../lib/logger';
import { mustVerifyEmail, UNVERIFIED_MESSAGE } from '../middlewares/requireVerified';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

interface QueueEntry {
  socket: TypedSocket;
  mmr: number;
  since: number;
}

/**
 * Quick play pairs players in arrival order.
 * Ranked pairs the two closest ratings, inside a window that widens while a
 * player waits — so a fair match is preferred, but nobody waits forever.
 */
const queues: Record<QueueMode, QueueEntry[]> = {
  pvp_quick: [],
  pvp_ranked: [],
};

const RANKED_BASE_WINDOW = 100;
const RANKED_WINDOW_PER_SECOND = 40;
const RANKED_SWEEP_MS = 2000;

let rankedSweep: NodeJS.Timeout | null = null;

const allQueued = (): QueueEntry[] => [...queues.pvp_quick, ...queues.pvp_ranked];

const toMode = (raw: unknown): QueueMode => (raw === 'pvp_ranked' ? 'pvp_ranked' : 'pvp_quick');

/** Rating gap a player accepts after waiting `waitedMs`. */
export const rankedWindow = (waitedMs: number): number =>
  RANKED_BASE_WINDOW + RANKED_WINDOW_PER_SECOND * Math.floor(waitedMs / 1000);

/** Picks the closest-rated pair whose gap fits the wider of their two windows. */
export const pickRankedPair = (entries: QueueEntry[], now: number): [QueueEntry, QueueEntry] | null => {
  const sorted = [...entries].sort((a, b) => a.mmr - b.mmr);
  let best: [QueueEntry, QueueEntry] | null = null;
  let bestGap = Infinity;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const gap = b.mmr - a.mmr;
    const allowed = Math.max(rankedWindow(now - a.since), rankedWindow(now - b.since));
    if (gap <= allowed && gap < bestGap) {
      best = [a, b];
      bestGap = gap;
    }
  }
  return best;
};

const stopSweepIfIdle = () => {
  if (queues.pvp_ranked.length < 2 && rankedSweep) {
    clearInterval(rankedSweep);
    rankedSweep = null;
  }
};

const matchRanked = (io: TypedServer) => {
  let pair = pickRankedPair(queues.pvp_ranked, Date.now());
  while (pair) {
    const [a, b] = pair;
    queues.pvp_ranked = queues.pvp_ranked.filter((e) => e !== a && e !== b);
    createRoom(io, a.socket, b.socket, 'pvp_ranked');
    pair = pickRankedPair(queues.pvp_ranked, Date.now());
  }
  stopSweepIfIdle();
};

export const joinQueue = (io: TypedServer, socket: TypedSocket, rawMode?: unknown) => {
  const mode = toMode(rawMode);
  const user = socket.data.user;
  if (!user) return;

  if (allQueued().some((e) => e.socket.id === socket.id)) return;

  if (isSocketInRoom(socket.id) || isUserInRoom(user.id)) {
    socket.emit('error:message', 'Vous êtes déjà en partie.');
    return;
  }

  if (allQueued().some((e) => e.socket.data.user?.id === user.id)) {
    socket.emit('error:message', "Vous êtes déjà en file d'attente sur un autre appareil.");
    return;
  }

  if (mode === 'pvp_ranked' && user.isGuest) {
    socket.emit('error:message', 'Le mode classé nécessite un compte.');
    return;
  }

  if (mode === 'pvp_ranked' && mustVerifyEmail(user)) {
    socket.emit('error:message', UNVERIFIED_MESSAGE);
    return;
  }

  const queue = queues[mode];
  queue.push({ socket, mmr: user.mmr ?? 0, since: Date.now() });
  socket.emit('matchmaking:status', { status: 'searching', queueSize: queue.length });
  logger.debug({ user: user.username, mode, queueSize: queue.length }, 'joined matchmaking');

  if (mode === 'pvp_quick') {
    if (queue.length >= 2) {
      const a = queue.shift()!;
      const b = queue.shift()!;
      createRoom(io, a.socket, b.socket, mode);
    }
    return;
  }

  matchRanked(io);
  // Players left waiting are re-examined as their window widens.
  if (queues.pvp_ranked.length >= 2 && !rankedSweep) {
    rankedSweep = setInterval(() => matchRanked(io), RANKED_SWEEP_MS);
    rankedSweep.unref?.();
  }
};

export const leaveQueue = (_io: TypedServer, socket: TypedSocket) => {
  (Object.keys(queues) as QueueMode[]).forEach((mode) => {
    const idx = queues[mode].findIndex((e) => e.socket.id === socket.id);
    if (idx === -1) return;
    queues[mode].splice(idx, 1);
    socket.emit('matchmaking:status', { status: 'cancelled', queueSize: queues[mode].length });
    logger.debug({ user: socket.data.user?.username }, 'left matchmaking');
  });
  stopSweepIfIdle();
};

export const isQueued = (userId: number): boolean => allQueued().some((e) => e.socket.data.user?.id === userId);

export const __test = {
  queues,
  reset: () => {
    queues.pvp_quick = [];
    queues.pvp_ranked = [];
    if (rankedSweep) clearInterval(rankedSweep);
    rankedSweep = null;
  },
};
