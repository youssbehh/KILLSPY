import { Server as HttpServer } from 'http';
import { Server as IoServer, Socket } from 'socket.io';
import { socketAuth, SocketData, SocketUser } from './auth';
import { joinQueue, leaveQueue } from './matchmaking';
import { handleAction, handleDisconnect, handleLeave, restoreMatches, tryResume } from './gameRoom';
import { acceptChallenge, cancelChallenge, declineChallenge, dropChallengesOf, sendChallenge } from './challenges';
import {
  clearRegistry,
  isOnline,
  registerSocket,
  registeredSocketIds,
  registeredUser,
  setIo,
  unregisterSocket,
  userRoom,
} from './hub';
import { ClientToServerEvents, ServerToClientEvents } from './events';
import { GameEventKind, dispatchGameEvent, setGameEventHandler, socketRef, startCluster } from './cluster';
import { ALLOWED_ORIGINS } from '../secrets';
import { logger } from '../lib/logger';

type TypedServer = IoServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

/** Game logic, run by the coordinator for every client of the cluster. */
const handleGameEvent = (io: TypedServer, kind: GameEventKind, socket: TypedSocket, payload: unknown) => {
  const user = socket.data.user!;
  switch (kind) {
    case 'connect':
      registerSocket(user, socket.id);
      // A match may be waiting for this player (lost connection, app reopened).
      tryResume(io, socket);
      return;
    case 'disconnect':
      unregisterSocket(user.id, socket.id);
      leaveQueue(io, socket);
      handleDisconnect(io, socket);
      if (!isOnline(user.id)) dropChallengesOf(user.id);
      return;
    case 'matchmaking:join':
      return joinQueue(io, socket, payload);
    case 'matchmaking:leave':
      return leaveQueue(io, socket);
    case 'game:action':
      return handleAction(io, socket, payload);
    case 'game:leave':
      return handleLeave(io, socket);
    case 'challenge:send':
      return void sendChallenge(io, socket, payload);
    case 'challenge:accept':
      return acceptChallenge(io, socket, payload);
    case 'challenge:decline':
      return declineChallenge(io, socket, payload);
    case 'challenge:cancel':
      return cancelChallenge(io, socket, payload);
  }
};

/** The coordinator starts (or a predecessor died): rebuild presence, reload matches, re-attach players. */
const takeOver = async (io: TypedServer, connected: { socketId: string; user: SocketUser }[]) => {
  clearRegistry();
  connected.forEach(({ socketId, user }) => registerSocket(user, socketId));
  await restoreMatches(io);
  connected.forEach(({ socketId, user }) => tryResume(io, socketRef(io, socketId, user)));
};

/** An instance died without its clients' disconnect events: treat its sockets as gone. */
const reconcile = (io: TypedServer, alive: Set<string>) => {
  for (const { userId, socketId } of registeredSocketIds()) {
    if (alive.has(socketId)) continue;
    const user = registeredUser(userId, socketId);
    if (user) handleGameEvent(io, 'disconnect', socketRef(io, socketId, user), undefined);
  }
};

const FORWARDED_EVENTS = [
  'matchmaking:join',
  'matchmaking:leave',
  'game:action',
  'game:leave',
  'challenge:send',
  'challenge:accept',
  'challenge:decline',
  'challenge:cancel',
] as const satisfies readonly (keyof ClientToServerEvents & GameEventKind)[];

export const attachSockets = (httpServer: HttpServer) => {
  const io: TypedServer = new IoServer(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS.length === 0 ? true : ALLOWED_ORIGINS,
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  setIo(io);
  setGameEventHandler(handleGameEvent);
  io.use(socketAuth);

  io.on('connection', (socket) => {
    const user = socket.data.user!;
    logger.info({ user: user.username, socketId: socket.id }, 'socket connected');

    // Pushes to this player (messages, friends, challenges) reach it through this room, from any instance.
    socket.join(userRoom(user.id));
    dispatchGameEvent(io, 'connect', socket);

    FORWARDED_EVENTS.forEach((event) => {
      socket.on(event, (payload?: unknown) => dispatchGameEvent(io, event, socket, payload));
    });

    socket.on('disconnect', () => {
      dispatchGameEvent(io, 'disconnect', socket);
      logger.info({ user: user.username }, 'socket disconnected');
    });
  });

  return io;
};

/**
 * Joins the cluster (or runs alone), and once this instance coordinates the
 * games, reloads the matches that were running before a restart.
 */
export const startRealtime = (io: TypedServer) => startCluster(io, { takeOver, reconcile });
