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
import { ClientToServerEvents, CombatFxNames, PvpMode, PublicPlayer, ServerToClientEvents } from './events';
import { SocketData } from './auth';
import { recordGame } from '../services/games.service';
import { GameOutcome, computeMmrDelta } from '../game/ranking';
import { computeMoneyReward } from '../game/economy';
import { computeXpReward } from '../game/progression';
import { prisma } from '../lib/prisma';

/** Pause between a resolved turn and the next one (lets clients play the reveal). */
const INTER_TURN_MS = 1500;
/** How long a disconnected player may come back before the match is forfeited. */
export const RECONNECT_GRACE_MS = 20_000;
/** After a server restart every player has to reconnect: they get a bit longer. */
export const RESTORE_GRACE_MS = 30_000;

const VALID_ACTIONS: readonly GameAction[] = ['shield', 'shoot', 'reload'];

interface RoomPlayer {
  userId: number;
  username: string;
  isGuest: boolean;
  fx: CombatFxNames;
  /** null while the player is disconnected and inside the grace period. */
  socketId: string | null;
  pendingAction: GameAction | null;
  graceTimer: NodeJS.Timeout | null;
  /** When the grace period of a disconnected player ends (null while connected). */
  graceUntil: number | null;
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
  /** Timestamp at which the open turn closes (null outside a turn). */
  turnDeadline: number | null;
  /** True only between turn:start and the resolution of that turn. */
  acceptingActions: boolean;
  finished: boolean;
  /** Reloaded from the database after a restart: play resumes once both players are back. */
  restored: boolean;
  /** Database writes of this room, chained so they land in order. */
  persistence: Promise<unknown>;
}

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();

export const isSocketInRoom = (socketId: string): boolean => socketToRoom.has(socketId);

const roomOfUser = (userId: number): Room | undefined => {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.userId === userId)) return room;
  }
  return undefined;
};

export const isUserInRoom = (userId: number): boolean => roomOfUser(userId) !== undefined;

const stateForPlayer = (room: Room, index: 0 | 1): GameState => {
  return index === 0 ? room.state : flipPerspective(room.state);
};

/** Sends to one player of the room, if currently connected. */
const emitTo = <E extends keyof ServerToClientEvents>(
  io: TypedServer,
  player: RoomPlayer,
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
) => {
  if (player.socketId) io.to(player.socketId).emit(event, ...args);
};

const emitState = (io: TypedServer, room: Room) => {
  emitTo(io, room.players[0], 'state:update', { state: stateForPlayer(room, 0) });
  emitTo(io, room.players[1], 'state:update', { state: stateForPlayer(room, 1) });
};

const clearTimers = (room: Room) => {
  if (room.turnTimer) clearTimeout(room.turnTimer);
  if (room.phaseTimer) clearTimeout(room.phaseTimer);
  room.turnTimer = null;
  room.phaseTimer = null;
  room.players.forEach((p) => {
    if (p.graceTimer) clearTimeout(p.graceTimer);
    p.graceTimer = null;
  });
};

// ── Persistence ─────────────────────────────────────────────────────────────

interface StoredPlayer {
  userId: number;
  username: string;
  isGuest: boolean;
  fx?: CombatFxNames;
}

const NO_FX: CombatFxNames = { shoot: null, shield: null };

const publicOf = (p: RoomPlayer): PublicPlayer => ({ id: p.userId, username: p.username, fx: p.fx });

/** Queues a database write after the previous ones of the room; a failure is logged, never thrown. */
const persist = (room: Room, write: () => Promise<unknown>) => {
  room.persistence = room.persistence
    .then(write)
    .catch((err) => logger.error({ err, roomId: room.id }, 'live match persistence failed'));
};

const saveMatch = (room: Room) => {
  const players: StoredPlayer[] = room.players.map((p) => ({
    userId: p.userId,
    username: p.username,
    isGuest: p.isGuest,
    fx: p.fx,
  }));
  const data = { mode: room.mode, players: players as never, state: room.state as never };
  persist(room, () =>
    prisma.liveMatch.upsert({ where: { id: room.id }, create: { id: room.id, ...data }, update: data }),
  );
};

const forgetMatch = (room: Room) => {
  persist(room, () => prisma.liveMatch.deleteMany({ where: { id: room.id } }));
};

// ── Disconnections ──────────────────────────────────────────────────────────

/** The player has `ms` to come back; otherwise they forfeit (or, if nobody is there, the match is void). */
const startGrace = (io: TypedServer, room: Room, player: RoomPlayer, ms: number) => {
  if (player.graceTimer) clearTimeout(player.graceTimer);
  player.graceUntil = Date.now() + ms;
  player.graceTimer = setTimeout(() => {
    player.graceTimer = null;
    const other = room.players.find((p) => p !== player)!;
    finishGame(io, room, player.userId, other.socketId === null);
  }, ms);
};

const startTurn = (io: TypedServer, room: Room) => {
  if (room.finished) return;
  room.phaseTimer = null;
  room.players[0].pendingAction = null;
  room.players[1].pendingAction = null;
  room.acceptingActions = true;

  const deadlineAt = Date.now() + TURN_DURATION_MS;
  room.turnDeadline = deadlineAt;
  room.players.forEach((p) => emitTo(io, p, 'turn:start', { round: room.state.round + 1, deadlineAt }));

  if (room.turnTimer) clearTimeout(room.turnTimer);
  room.turnTimer = setTimeout(() => resolveAndContinue(io, room), TURN_DURATION_MS);
};

const resolveAndContinue = (io: TypedServer, room: Room) => {
  if (room.finished || !room.acceptingActions) return;
  // Close the turn first: any action arriving from now on belongs to no turn.
  room.acceptingActions = false;
  room.turnDeadline = null;
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
    saveMatch(room);
    room.phaseTimer = setTimeout(() => startTurn(io, room), INTER_TURN_MS);
  } else {
    finishGame(io, room);
  }
};

/**
 * Ends the match. `voided`: nobody is there to win (both players gone after a
 * restart): it ends like a match abandoned before its first turn.
 */
const finishGame = (io: TypedServer, room: Room, forfeitByUserId?: number, voided = false) => {
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
  const cancelled = voided || (forfeitByUserId !== undefined && room.state.round === 0);

  ([0, 1] as const).forEach((idx) => {
    const player = room.players[idx];
    const outcome = outcomeFor(idx);
    const rewarded = !cancelled && !player.isGuest;
    emitTo(io, player, 'game:over', {
      outcome:
        forfeitByUserId !== undefined && player.userId !== forfeitByUserId ? 'opponent_forfeit' : outcome,
      finalState: stateForPlayer(room, idx),
      mode: room.mode,
      rewards: {
        mmrDelta: rewarded ? computeMmrDelta(outcome, room.mode) : 0,
        moneyDelta: rewarded ? computeMoneyReward(outcome, room.mode) : 0,
        xpDelta: rewarded ? computeXpReward(outcome, room.mode) : 0,
      },
    });
  });

  if (!cancelled) {
    // Persist results (fire-and-forget; errors logged but don't crash cleanup).
    Promise.all(
      ([0, 1] as const).map((idx) =>
        recordGame({
          userId: room.players[idx].userId,
          outcome: outcomeFor(idx),
          mode: room.mode,
          rounds: room.state.round,
          opponentId: room.players[idx === 0 ? 1 : 0].userId,
        }),
      ),
    ).catch((err) => logger.error({ err, roomId: room.id }, 'failed to record PvP game outcome'));
  }

  destroyRoom(io, room.id);
};

const destroyRoom = (io: TypedServer, roomId: string) => {
  const room = rooms.get(roomId);
  if (!room) return;
  room.finished = true;
  clearTimers(room);
  room.players.forEach((p) => {
    if (!p.socketId) return;
    socketToRoom.delete(p.socketId);
    io.in(p.socketId).socketsLeave(roomId);
  });
  rooms.delete(roomId);
  forgetMatch(room);
};

export const createRoom = (io: TypedServer, a: TypedSocket, b: TypedSocket, mode: PvpMode): Room => {
  const id = randomUUID();
  const toPlayer = (s: TypedSocket): RoomPlayer => ({
    userId: s.data.user!.id,
    username: s.data.user!.username,
    isGuest: s.data.user!.isGuest,
    fx: s.data.user!.fx ?? NO_FX,
    socketId: s.id,
    pendingAction: null,
    graceTimer: null,
    graceUntil: null,
  });
  const room: Room = {
    id,
    mode,
    players: [toPlayer(a), toPlayer(b)],
    state: createInitialState(),
    turnTimer: null,
    phaseTimer: null,
    turnDeadline: null,
    acceptingActions: false,
    finished: false,
    restored: false,
    persistence: Promise.resolve(),
  };
  saveMatch(room);
  rooms.set(id, room);
  socketToRoom.set(a.id, id);
  socketToRoom.set(b.id, id);
  a.join(id);
  b.join(id);

  ([0, 1] as const).forEach((idx) => {
    const opponent = room.players[idx === 0 ? 1 : 0];
    emitTo(io, room.players[idx], 'match:found', {
      roomId: id,
      mode,
      opponent: publicOf(opponent),
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

  // A disconnected opponent has no pending action: the turn then runs to its deadline.
  if (room.players.every((p) => p.pendingAction !== null)) {
    resolveAndContinue(io, room);
  }
};

/** Explicit "leave / forfeit" from the client: the match ends right away. */
export const handleLeave = (io: TypedServer, socket: TypedSocket) => {
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

/**
 * Lost connection: the match keeps running (missed turns are played by the AFK rule)
 * and the player has RECONNECT_GRACE_MS to come back before forfeiting.
 */
export const handleDisconnect = (io: TypedServer, socket: TypedSocket) => {
  const roomId = socketToRoom.get(socket.id);
  if (!roomId) return;
  socketToRoom.delete(socket.id);
  const room = rooms.get(roomId);
  if (!room || room.finished) return;

  const idx = room.players.findIndex((p) => p.socketId === socket.id);
  if (idx === -1) return;
  const player = room.players[idx];
  const other = room.players[idx === 0 ? 1 : 0];
  player.socketId = null;

  // Nobody left to play against: no point in waiting.
  if (other.socketId === null) {
    finishGame(io, room, player.userId);
    return;
  }

  emitTo(io, other, 'opponent:status', { connected: false, graceMs: RECONNECT_GRACE_MS });
  startGrace(io, room, player, RECONNECT_GRACE_MS);
  logger.info({ roomId, user: player.username }, 'player disconnected, grace period started');
};

/**
 * Called for every new connection: if the user has a match waiting for them,
 * re-attach this socket to it. Returns true when a match was resumed.
 */
export const tryResume = (io: TypedServer, socket: TypedSocket): boolean => {
  const user = socket.data.user;
  if (!user) return false;
  const room = roomOfUser(user.id);
  if (!room || room.finished) return false;

  const idx = room.players.findIndex((p) => p.userId === user.id) as 0 | 1;
  const player = room.players[idx];
  // Still connected from another device: that one keeps the match.
  if (player.socketId !== null) return false;

  if (player.graceTimer) clearTimeout(player.graceTimer);
  player.graceTimer = null;
  player.graceUntil = null;
  player.socketId = socket.id;
  socketToRoom.set(socket.id, room.id);
  socket.join(room.id);

  const other = room.players[idx === 0 ? 1 : 0];
  socket.emit('match:resume', {
    roomId: room.id,
    mode: room.mode,
    opponent: publicOf(other),
    state: stateForPlayer(room, idx),
    turnRemainingMs: room.turnDeadline === null ? null : Math.max(0, room.turnDeadline - Date.now()),
  });
  emitTo(io, other, 'opponent:status', { connected: true });
  if (other.socketId === null && other.graceUntil !== null) {
    // Back before the opponent (typically right after a server restart): tell them how long they wait.
    socket.emit('opponent:status', { connected: false, graceMs: Math.max(0, other.graceUntil - Date.now()) });
  }

  if (room.restored && other.socketId !== null) {
    // Both players are back after a restart: play resumes with the next turn.
    room.restored = false;
    room.phaseTimer = setTimeout(() => startTurn(io, room), INTER_TURN_MS);
  }
  logger.info({ roomId: room.id, user: player.username }, 'player resumed match');
  return true;
};

/**
 * At startup: reloads the matches that were running when the server stopped.
 * Their players reconnect on their own (socket.io retries) and get them back via
 * tryResume; whoever does not return in time forfeits, and if nobody returns the
 * match is void.
 */
export const restoreMatches = async (io: TypedServer): Promise<number> => {
  const saved = await prisma.liveMatch.findMany();
  let restored = 0;
  for (const row of saved) {
    const state = row.state as unknown as GameState;
    const stored = row.players as unknown as StoredPlayer[];
    if (rooms.has(row.id) || state?.status !== 'choosing' || !Array.isArray(stored) || stored.length !== 2) {
      await prisma.liveMatch.deleteMany({ where: { id: row.id } });
      continue;
    }
    const toPlayer = (p: StoredPlayer): RoomPlayer => ({
      ...p,
      fx: p.fx ?? NO_FX,
      socketId: null,
      pendingAction: null,
      graceTimer: null,
      graceUntil: null,
    });
    const room: Room = {
      id: row.id,
      mode: row.mode as PvpMode,
      players: [toPlayer(stored[0]), toPlayer(stored[1])],
      state,
      turnTimer: null,
      phaseTimer: null,
      turnDeadline: null,
      acceptingActions: false,
      finished: false,
      restored: true,
      persistence: Promise.resolve(),
    };
    rooms.set(room.id, room);
    room.players.forEach((p) => startGrace(io, room, p, RESTORE_GRACE_MS));
    restored++;
  }
  if (restored > 0) logger.info({ restored }, 'live matches restored after restart');
  return restored;
};

/** Waits for every pending database write (tests, graceful shutdown). */
export const flushPersistence = async () => {
  await Promise.all([...rooms.values()].map((r) => r.persistence));
};

export const __test = {
  rooms,
  socketToRoom,
  /** Simulates a crash: the process forgets every match, the database keeps them. */
  forgetInMemory: () => {
    rooms.forEach((room) => {
      room.finished = true;
      clearTimers(room);
    });
    rooms.clear();
    socketToRoom.clear();
  },
};
