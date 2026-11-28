import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from './events';
import type { SocketData, SocketUser } from './auth';

/**
 * Bridge between the REST services, the game logic and the connected clients.
 *
 * Every socket joins the room `user:<id>` of its player. Sending to a user and
 * disconnecting a user go through that room, so they work from any API instance
 * once the cluster adapter is on (see cluster.ts) — a REST call served by one
 * machine reaches a player connected to another.
 *
 * The presence registry (socketsByUser) is kept by the game coordinator only:
 * it feeds matchmaking and friend challenges. REST code asks for presence with
 * the async `onlineUserIds`, which queries the whole cluster.
 */

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

let io: TypedServer | null = null;
const socketsByUser = new Map<number, Map<string, SocketUser>>();

export const setIo = (server: TypedServer) => {
  io = server;
};

export const userRoom = (userId: number) => `user:${userId}`;

// ── Coordinator-side registry (matchmaking, challenges) ──────────────────────

export const registerSocket = (user: SocketUser, socketId: string) => {
  const sockets = socketsByUser.get(user.id) ?? new Map<string, SocketUser>();
  sockets.set(socketId, user);
  socketsByUser.set(user.id, sockets);
};

export const unregisterSocket = (userId: number, socketId: string) => {
  const sockets = socketsByUser.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) socketsByUser.delete(userId);
};

export const isOnline = (userId: number): boolean => socketsByUser.has(userId);

export const socketIdsOf = (userId: number): string[] => [...(socketsByUser.get(userId)?.keys() ?? [])];

/** The player data a socket authenticated with (coordinator registry). */
export const registeredUser = (userId: number, socketId: string): SocketUser | undefined =>
  socketsByUser.get(userId)?.get(socketId);

export const registeredSocketIds = (): { userId: number; socketId: string }[] =>
  [...socketsByUser.entries()].flatMap(([userId, sockets]) => [...sockets.keys()].map((socketId) => ({ userId, socketId })));

export const clearRegistry = () => socketsByUser.clear();

// ── Anywhere in the cluster ──────────────────────────────────────────────────

/** Sends an event to every connected device of a user. No-op when offline or in tests. */
export const emitToUser = <E extends keyof ServerToClientEvents>(
  userId: number,
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
): void => {
  if (!io) return;
  io.to(userRoom(userId)).emit(event, ...args);
};

/** Closes every live connection of a user (suspension): their match is forfeited like any disconnection. */
export const disconnectUser = (userId: number): void => {
  if (!io) return;
  io.in(userRoom(userId)).disconnectSockets(true);
};

/** Which of these players have at least one open connection, on any instance. */
export const onlineUserIds = async (userIds: number[]): Promise<Set<number>> => {
  if (!io || userIds.length === 0) return new Set();
  try {
    const sockets = await io.in(userIds.map(userRoom)).fetchSockets();
    return new Set(sockets.map((s) => s.data.user?.id).filter((id): id is number => id !== undefined));
  } catch {
    // Another instance did not answer in time: fall back to what this one knows.
    return new Set(userIds.filter(isOnline));
  }
};

export const __test = { socketsByUser };
