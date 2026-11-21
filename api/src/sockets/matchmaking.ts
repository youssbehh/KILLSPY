import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, PvpMode, ServerToClientEvents } from './events';
import { SocketData } from './auth';
import { createRoom, isSocketInRoom, isUserInRoom } from './gameRoom';
import { logger } from '../lib/logger';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

/** One FIFO queue per PvP mode. */
const queues: Record<PvpMode, TypedSocket[]> = {
  pvp_quick: [],
  pvp_ranked: [],
};

const allQueued = (): TypedSocket[] => [...queues.pvp_quick, ...queues.pvp_ranked];

const toMode = (raw: unknown): PvpMode => (raw === 'pvp_ranked' ? 'pvp_ranked' : 'pvp_quick');

export const joinQueue = (io: TypedServer, socket: TypedSocket, rawMode?: unknown) => {
  const mode = toMode(rawMode);
  const user = socket.data.user;
  if (!user) return;

  if (allQueued().some((s) => s.id === socket.id)) return;

  if (isSocketInRoom(socket.id) || isUserInRoom(user.id)) {
    socket.emit('error:message', 'Vous êtes déjà en partie.');
    return;
  }

  if (allQueued().some((s) => s.data.user?.id === user.id)) {
    socket.emit('error:message', "Vous êtes déjà en file d'attente sur un autre appareil.");
    return;
  }

  if (mode === 'pvp_ranked' && user.isGuest) {
    socket.emit('error:message', 'Le mode classé nécessite un compte.');
    return;
  }

  const queue = queues[mode];
  queue.push(socket);
  socket.emit('matchmaking:status', { status: 'searching', queueSize: queue.length });
  logger.debug({ user: user.username, mode, queueSize: queue.length }, 'joined matchmaking');

  if (queue.length >= 2) {
    const a = queue.shift()!;
    const b = queue.shift()!;
    createRoom(io, a, b, mode);
  }
};

export const leaveQueue = (_io: TypedServer, socket: TypedSocket) => {
  for (const queue of Object.values(queues)) {
    const idx = queue.findIndex((s) => s.id === socket.id);
    if (idx === -1) continue;
    queue.splice(idx, 1);
    socket.emit('matchmaking:status', { status: 'cancelled', queueSize: queue.length });
    logger.debug({ user: socket.data.user?.username }, 'left matchmaking');
  }
};

export const __test = { queues };
