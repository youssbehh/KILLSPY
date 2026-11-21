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
import { ClientToServerEvents, PvpMode, ServerToClientEvents } from './events';
import { SocketData } from './auth';
import { recordGame } from '../services/games.service';
import { GameOutcome, computeMmrDelta } from '../game/ranking';
import { computeMoneyReward } from '../game/economy';

/** Pause between a resolved turn and the next one (lets clients play the reveal). */
const INTER_TURN_MS = 1500;

const VALID_ACTIONS: readonly GameAction[] = ['shield', 'shoot', 'reload'];

interface RoomPlayer {
  userId: number;
  username: string;
  isGuest: boolean;
  socketId: string;
  pendingAction: GameAction | null;
}

interface Room {
  id: string;
  mode: PvpMode;
  players: [RoomPlayer, RoomPlayer];
  state: GameState;
  /** Deadline timer of the turn in progress. */
  turnTimer: NodeJS.Timeout | null;
  /** Countdown / inter-turn timer leading to the next startTurn. */
  phaseTimer: NodeJS.Timeout | null;
  /** True only between turn:start and the resolution of that turn. */
  acceptingActions: boolean;
  finished: boolean;
}

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();

export const isSocketInRoom = (socketId: string): boolean => socketToRoom.has(socketId);

export const isUserInRoom = (userId: number): boolean => {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.userId === userId)) return true;
  }
  return false;
};

const stateForPlayer = (room: Room, index: 0 | 1): GameState => {
  return index === 0 ? room.state : flipPerspective(room.state);
};

const emitState = (io: TypedServer, room: Room) => {
  io.to(room.players[0].socketId).emit('state:update', { state: stateForPlayer(room, 0) });
  io.to(room.players[1].socketId).emit('state:update', { state: stateForPlayer(room, 1) });
};

const clearTimers = (room: Room) => {
  if (room.turnTimer) clearTimeout(room.turnTimer);
  if (room.phaseTimer) clearTimeout(room.phaseTimer);
  room.turnTimer = null;
  room.phaseTimer = null;
};

const startTurn = (io: TypedServer, room: Room) => {
  if (room.finished) return;
  room.phaseTimer = null;
  room.players[0].pendingAction = null;
  room.players[1].pendingAction = null;
  room.acceptingActions = true;

  const deadlineAt = Date.now() + TURN_DURATION_MS;
  io.to(room.id).emit('turn:start', { round: room.state.round + 1, deadlineAt });

  if (room.turnTimer) clearTimeout(room.turnTimer);
  room.turnTimer = setTimeout(() => resolveAndContinue(io, room), TURN_DURATION_MS);
};

const resolveAndContinue = (io: TypedServer, room: Room) => {
  if (room.finished || !room.acceptingActions) return;
  // Close the turn first: any action arriving from now on belongs to no turn.
  room.acceptingActions = false;
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }

  const a0 = room.players[0].pendingAction ?? forcedAction(room.state.player);
  const a1 = room.players[1].pendingAction ?? forcedAction(room.state.opponent);
  room.players[0].pendingAction = null;
  room.players[1].pendingAction = null;

  room.state = resolveTurn(room.state, a0, a1);

  emitState(io, room);

  if (room.state.status === 'choosing') {
    room.phaseTimer = setTimeout(() => startTurn(io, room), INTER_TURN_MS);
  } else {
    finishGame(io, room);
  }
};

const finishGame = (io: TypedServer, room: Room, forfeitByUserId?: number) => {
  if (room.finished) return;
  room.finished = true;
  room.acceptingActions = false;
  clearTimers(room);

  const outcomeFor = (idx: 0 | 1): GameOutcome => {
    if (forfeitByUserId !== undefined) {
      return room.players[idx].userId === forfeitByUserId ? 'lost' : 'won';
    }
    if (room.state.status === 'draw') return 'draw';
    if (idx === 0) return room.state.status === 'won' ? 'won' : 'lost';
    return room.state.status === 'won' ? 'lost' : 'won';
  };

  // A match abandoned before a single turn was resolved is cancelled: nothing is
  // recorded and nobody is rewarded (otherwise instant forfeits farm coins).
  const cancelled = forfeitByUserId !== undefined && room.state.round === 0;

  ([0, 1] as const).forEach((idx) => {
    const player = room.players[idx];
    const outcome = outcomeFor(idx);
    const rewarded = !cancelled && !player.isGuest;
    io.to(player.socketId).emit('game:over', {
      outcome:
        forfeitByUserId !== undefined && player.userId !== forfeitByUserId ? 'opponent_forfeit' : outcome,
      finalState: stateForPlayer(room, idx),
      mode: room.mode,
      rewards: {
        mmrDelta: rewarded ? computeMmrDelta(outcome, room.mode) : 0,
        moneyDelta: rewarded ? computeMoneyReward(outcome, room.mode) : 0,
      },
    });
  });

  if (!cancelled) {
    // Persist results (fire-and-forget; errors logged but don't crash cleanup).
    Promise.all([
      recordGame({ userId: room.players[0].userId, outcome: outcomeFor(0), mode: room.mode }),
      recordGame({ userId: room.players[1].userId, outcome: outcomeFor(1), mode: room.mode }),
    ]).catch((err) => logger.error({ err, roomId: room.id }, 'failed to record PvP game outcome'));
  }

  destroyRoom(io, room.id);
};

const destroyRoom = (io: TypedServer, roomId: string) => {
  const room = rooms.get(roomId);
  if (!room) return;
  room.finished = true;
  clearTimers(room);
  room.players.forEach((p) => {
    socketToRoom.delete(p.socketId);
    const sock = io.sockets.sockets.get(p.socketId);
    sock?.leave(roomId);
  });
  rooms.delete(roomId);
};

export const createRoom = (io: TypedServer, a: TypedSocket, b: TypedSocket, mode: PvpMode): Room => {
  const id = randomUUID();
  const toPlayer = (s: TypedSocket): RoomPlayer => ({
    userId: s.data.user!.id,
    username: s.data.user!.username,
    isGuest: s.data.user!.isGuest,
    socketId: s.id,
    pendingAction: null,
  });
  const room: Room = {
    id,
    mode,
    players: [toPlayer(a), toPlayer(b)],
    state: createInitialState(),
    turnTimer: null,
    phaseTimer: null,
    acceptingActions: false,
    finished: false,
  };
  rooms.set(id, room);
  socketToRoom.set(a.id, id);
  socketToRoom.set(b.id, id);
  a.join(id);
  b.join(id);

  ([0, 1] as const).forEach((idx) => {
    const opponent = room.players[idx === 0 ? 1 : 0];
    io.to(room.players[idx].socketId).emit('match:found', {
      roomId: id,
      mode,
      opponent: { id: opponent.userId, username: opponent.username },
      countdownMs: COUNTDOWN_DURATION_MS,
      turnMs: TURN_DURATION_MS,
    });
  });

  emitState(io, room);

  room.phaseTimer = setTimeout(() => startTurn(io, room), COUNTDOWN_DURATION_MS);

  logger.info({ roomId: id, mode, p1: a.data.user!.username, p2: b.data.user!.username }, 'match created');
  return room;
};

export const handleAction = (io: TypedServer, socket: TypedSocket, action: unknown) => {
  const roomId = socketToRoom.get(socket.id);
  if (!roomId) return socket.emit('error:message', 'Pas de partie en cours.');
  const room = rooms.get(roomId);
  if (!room || room.finished) return;
  // Outside of an open turn (countdown, reveal pause) actions are ignored.
  if (!room.acceptingActions || room.state.status !== 'choosing') return;

  if (typeof action !== 'string' || !VALID_ACTIONS.includes(action as GameAction)) {
    return socket.emit('error:message', 'Action inconnue.');
  }
  const gameAction = action as GameAction;

  const idx = room.players.findIndex((p) => p.socketId === socket.id) as 0 | 1 | -1;
  if (idx === -1) return;
  // One action per turn: the first choice is final.
  if (room.players[idx].pendingAction !== null) return;

  const playerState = stateForPlayer(room, idx as 0 | 1).player;
  if (!isActionLegal(playerState, gameAction)) {
    return socket.emit('error:message', `Action illégale (${gameAction}).`);
  }

  room.players[idx].pendingAction = gameAction;

  if (room.players.every((p) => p.pendingAction !== null)) {
    resolveAndContinue(io, room);
  }
};

export const handleLeaveOrDisconnect = (io: TypedServer, socket: TypedSocket) => {
  const roomId = socketToRoom.get(socket.id);
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (!room) {
    socketToRoom.delete(socket.id);
    return;
  }

  const leaver = room.players.find((p) => p.socketId === socket.id);
  if (leaver && room.state.status === 'choosing') {
    finishGame(io, room, leaver.userId);
    return;
  }
  destroyRoom(io, roomId);
};

export const __test = { rooms, socketToRoom };
