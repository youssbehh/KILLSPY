import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import {
  GameAction,
  GameState,
  TURN_DURATION_MS,
  COUNTDOWN_DURATION_MS,
  createInitialState,
  flipPerspective,
  forcedAction,
  isActionLegal,
  resolveTurn,
} from '../game/gameEngine';
import { logger } from '../lib/logger';
import { ClientToServerEvents, ServerToClientEvents } from './events';
import { SocketData } from './auth';
import { recordGame } from '../services/games.service';
import { GameOutcome } from '../game/ranking';

interface RoomPlayer {
  userId: number;
  username: string;
  socketId: string;
  pendingAction: GameAction | null;
}

interface Room {
  id: string;
  players: [RoomPlayer, RoomPlayer];
  state: GameState;
  turnTimer: NodeJS.Timeout | null;
}

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();

const stateForPlayer = (room: Room, index: 0 | 1): GameState => {
  return index === 0 ? room.state : flipPerspective(room.state);
};

const emitState = (io: TypedServer, room: Room) => {
  io.to(room.players[0].socketId).emit('state:update', { state: stateForPlayer(room, 0) });
  io.to(room.players[1].socketId).emit('state:update', { state: stateForPlayer(room, 1) });
};

const startTurn = (io: TypedServer, room: Room) => {
  room.players[0].pendingAction = null;
  room.players[1].pendingAction = null;

  const deadlineAt = Date.now() + TURN_DURATION_MS;
  io.to(room.id).emit('turn:start', { round: room.state.round + 1, deadlineAt });

  if (room.turnTimer) clearTimeout(room.turnTimer);
  room.turnTimer = setTimeout(() => {
    room.players.forEach((p) => {
      if (!p.pendingAction) p.pendingAction = forcedAction(stateForPlayer(room, room.players.indexOf(p) as 0 | 1).player);
    });
    resolveAndContinue(io, room);
  }, TURN_DURATION_MS);
};

const resolveAndContinue = (io: TypedServer, room: Room) => {
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }

  const a0 = room.players[0].pendingAction ?? forcedAction(room.state.player);
  const a1 = room.players[1].pendingAction ?? forcedAction(room.state.opponent);

  room.state = resolveTurn(room.state, a0, a1);

  emitState(io, room);

  if (room.state.status === 'choosing') {
    setTimeout(() => startTurn(io, room), 1500);
  } else {
    finishGame(io, room);
  }
};

const finishGame = (io: TypedServer, room: Room, forfeitByUserId?: number) => {
  const outcomeFor = (idx: 0 | 1): GameOutcome => {
    if (forfeitByUserId !== undefined) {
      return room.players[idx].userId === forfeitByUserId ? 'lost' : 'won';
    }
    if (room.state.status === 'draw') return 'draw';
    if (idx === 0) return room.state.status === 'won' ? 'won' : 'lost';
    return room.state.status === 'won' ? 'lost' : 'won';
  };

  const eventOutcome = (idx: 0 | 1): GameOutcome | 'opponent_forfeit' => {
    if (forfeitByUserId !== undefined && room.players[idx].userId !== forfeitByUserId) {
      return 'opponent_forfeit';
    }
    return outcomeFor(idx);
  };

  io.to(room.players[0].socketId).emit('game:over', {
    outcome: eventOutcome(0),
    finalState: stateForPlayer(room, 0),
  });
  io.to(room.players[1].socketId).emit('game:over', {
    outcome: eventOutcome(1),
    finalState: stateForPlayer(room, 1),
  });

  // Persist results (fire-and-forget; errors logged but don't crash cleanup).
  Promise.all([
    recordGame({ userId: room.players[0].userId, outcome: outcomeFor(0), mode: 'pvp_quick' }),
    recordGame({ userId: room.players[1].userId, outcome: outcomeFor(1), mode: 'pvp_quick' }),
  ]).catch((err) => logger.error({ err, roomId: room.id }, 'failed to record PvP game outcome'));

  destroyRoom(io, room.id);
};

const destroyRoom = (io: TypedServer, roomId: string) => {
  const room = rooms.get(roomId);
  if (!room) return;
  if (room.turnTimer) clearTimeout(room.turnTimer);
  room.players.forEach((p) => {
    socketToRoom.delete(p.socketId);
    const sock = io.sockets.sockets.get(p.socketId);
    sock?.leave(roomId);
  });
  rooms.delete(roomId);
};

export const createRoom = (io: TypedServer, a: TypedSocket, b: TypedSocket): Room => {
  const id = randomUUID();
  const room: Room = {
    id,
    players: [
      { userId: a.data.user!.id, username: a.data.user!.username, socketId: a.id, pendingAction: null },
      { userId: b.data.user!.id, username: b.data.user!.username, socketId: b.id, pendingAction: null },
    ],
    state: createInitialState(),
    turnTimer: null,
  };
  rooms.set(id, room);
  socketToRoom.set(a.id, id);
  socketToRoom.set(b.id, id);
  a.join(id);
  b.join(id);

  io.to(a.id).emit('match:found', {
    roomId: id,
    opponent: { id: room.players[1].userId, username: room.players[1].username },
    countdownMs: COUNTDOWN_DURATION_MS,
    turnMs: TURN_DURATION_MS,
  });
  io.to(b.id).emit('match:found', {
    roomId: id,
    opponent: { id: room.players[0].userId, username: room.players[0].username },
    countdownMs: COUNTDOWN_DURATION_MS,
    turnMs: TURN_DURATION_MS,
  });

  emitState(io, room);

  setTimeout(() => startTurn(io, room), COUNTDOWN_DURATION_MS);

  logger.info({ roomId: id, p1: a.data.user!.username, p2: b.data.user!.username }, 'match created');
  return room;
};

export const handleAction = (io: TypedServer, socket: TypedSocket, action: GameAction) => {
  const roomId = socketToRoom.get(socket.id);
  if (!roomId) return socket.emit('error:message', "Pas de partie en cours.");
  const room = rooms.get(roomId);
  if (!room) return;
  if (room.state.status !== 'choosing') return;

  const idx = room.players.findIndex((p) => p.socketId === socket.id) as 0 | 1 | -1;
  if (idx === -1) return;

  const playerState = stateForPlayer(room, idx as 0 | 1).player;
  if (!isActionLegal(playerState, action)) {
    return socket.emit('error:message', `Action illégale (${action}).`);
  }

  room.players[idx].pendingAction = action;

  if (room.players.every((p) => p.pendingAction !== null)) {
    resolveAndContinue(io, room);
  }
};

export const handleLeaveOrDisconnect = (io: TypedServer, socket: TypedSocket) => {
  const roomId = socketToRoom.get(socket.id);
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (!room) return;

  if (room.state.status === 'choosing') {
    const leaver = room.players.find((p) => p.socketId === socket.id);
    if (leaver) {
      finishGame(io, room, leaver.userId);
      return;
    }
  }
  destroyRoom(io, roomId);
};

export const __test = { rooms, socketToRoom };
