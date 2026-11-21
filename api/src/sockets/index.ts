import { Server as HttpServer } from 'http';
import { Server as IoServer } from 'socket.io';
import { socketAuth, SocketData } from './auth';
import { joinQueue, leaveQueue } from './matchmaking';
import { handleAction, handleDisconnect, handleLeave, tryResume } from './gameRoom';
import { acceptChallenge, cancelChallenge, declineChallenge, dropChallengesOf, sendChallenge } from './challenges';
import { isOnline, registerSocket, setIo, unregisterSocket } from './hub';
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

  setIo(io);
  io.use(socketAuth);

  io.on('connection', (socket) => {
    const user = socket.data.user!;
    logger.info({ user: user.username, socketId: socket.id }, 'socket connected');

    registerSocket(user.id, socket.id);
    // A match may be waiting for this player (lost connection, app reopened).
    tryResume(io, socket);

    socket.on('matchmaking:join', (mode) => joinQueue(io, socket, mode));
    socket.on('matchmaking:leave', () => leaveQueue(io, socket));
    socket.on('game:action', (action) => handleAction(io, socket, action));
    socket.on('game:leave', () => handleLeave(io, socket));
    socket.on('challenge:send', (friendId) => void sendChallenge(io, socket, friendId));
    socket.on('challenge:accept', (fromId) => acceptChallenge(io, socket, fromId));
    socket.on('challenge:decline', (fromId) => declineChallenge(io, socket, fromId));
    socket.on('challenge:cancel', (friendId) => cancelChallenge(io, socket, friendId));

    socket.on('disconnect', () => {
      unregisterSocket(user.id, socket.id);
      leaveQueue(io, socket);
      handleDisconnect(io, socket);
      if (!isOnline(user.id)) dropChallengesOf(user.id);
      logger.info({ user: user.username }, 'socket disconnected');
    });
  });

  return io;
};
