import { Server as HttpServer } from 'http';
import { Server as IoServer } from 'socket.io';
import { socketAuth, SocketData } from './auth';
import { joinQueue, leaveQueue } from './matchmaking';
import { handleAction, handleLeaveOrDisconnect } from './gameRoom';
import { ClientToServerEvents, ServerToClientEvents } from './events';
import { ALLOWED_ORIGINS } from '../secrets';
import { logger } from '../lib/logger';

export const attachSockets = (httpServer: HttpServer) => {
  const io = new IoServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS.length === 0 ? true : ALLOWED_ORIGINS,
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    logger.info({ user: socket.data.user?.username, socketId: socket.id }, 'socket connected');

    socket.on('matchmaking:join', () => joinQueue(io, socket));
    socket.on('matchmaking:leave', () => leaveQueue(io, socket));
    socket.on('game:action', (action) => handleAction(io, socket, action));
    socket.on('game:leave', () => handleLeaveOrDisconnect(io, socket));
    socket.on('disconnect', () => {
      leaveQueue(io, socket);
      handleLeaveOrDisconnect(io, socket);
      logger.info({ user: socket.data.user?.username }, 'socket disconnected');
    });
  });

  return io;
};
