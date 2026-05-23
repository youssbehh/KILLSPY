import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from './events';
import { SocketData } from './auth';
import { createRoom } from './gameRoom';
import { logger } from '../lib/logger';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

const queue: TypedSocket[] = [];

const broadcastQueueStatus = (io: TypedServer, status: 'searching' | 'cancelled') => {
  io.to(queue.map((s) => s.id)).emit('matchmaking:status', { status, queueSize: queue.length });
};

export const joinQueue = (io: TypedServer, socket: TypedSocket) => {
  if (queue.some((s) => s.id === socket.id)) return;

  if (queue.some((s) => s.data.user?.id === socket.data.user?.id)) {
    socket.emit('error:message', 'Vous êtes déjà en file d\'attente sur un autre appareil.');
    return;
  }

  queue.push(socket);
  socket.emit('matchmaking:status', { status: 'searching', queueSize: queue.length });
  logger.debug({ user: socket.data.user?.username, queueSize: queue.length }, 'joined matchmaking');

  if (queue.length >= 2) {
    const a = queue.shift()!;
    const b = queue.shift()!;
    createRoom(io, a, b);
  }
};

export const leaveQueue = (io: TypedServer, socket: TypedSocket) => {
  const idx = queue.findIndex((s) => s.id === socket.id);
  if (idx === -1) return;
  queue.splice(idx, 1);
  socket.emit('matchmaking:status', { status: 'cancelled', queueSize: queue.length });
  logger.debug({ user: socket.data.user?.username }, 'left matchmaking');
};

export const __test = { queue };
