import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from './events';
import type { SocketData } from './auth';

/**
 * Presence registry and the bridge that lets REST services push socket events
 * (new message, friend request…) without importing the socket server directly.
 */

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

let io: TypedServer | null = null;
const socketsByUser = new Map<number, Set<string>>();

export const setIo = (server: TypedServer) => {
  io = server;
};

export const registerSocket = (userId: number, socketId: string) => {
  const set = socketsByUser.get(userId) ?? new Set<string>();
  set.add(socketId);
  socketsByUser.set(userId, set);
};

export const unregisterSocket = (userId: number, socketId: string) => {
  const set = socketsByUser.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) socketsByUser.delete(userId);
};

export const isOnline = (userId: number): boolean => socketsByUser.has(userId);

export const socketIdsOf = (userId: number): string[] => [...(socketsByUser.get(userId) ?? [])];

/** Sends an event to every connected device of a user. No-op when offline or in tests. */
export const emitToUser = <E extends keyof ServerToClientEvents>(
  userId: number,
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
): void => {
  if (!io) return;
  for (const socketId of socketIdsOf(userId)) {
    io.to(socketId).emit(event, ...args);
  }
};

/** Closes every live connection of a user (suspension): their match is forfeited like any disconnection. */
export const disconnectUser = (userId: number): void => {
  if (!io) return;
  for (const socketId of socketIdsOf(userId)) {
    io.sockets.sockets.get(socketId)?.disconnect(true);
  }
};

export const __test = { socketsByUser };
