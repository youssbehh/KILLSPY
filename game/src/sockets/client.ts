import { io, Socket } from 'socket.io-client';
import { getToken } from '../stores/authStore';
import { ClientToServerEvents, ServerToClientEvents } from './events';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: GameSocket | null = null;

const baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ?? '';

/**
 * The singleton socket, created on first use but NOT connected.
 * Attach listeners on it before calling getSocket(): the server may push events
 * (a match to resume) as soon as the connection opens.
 */
export const ensureSocket = (): GameSocket => {
  if (!socket) {
    socket = io(baseURL, {
      // Re-read the token on every (re)connection attempt so a refreshed session is used.
      auth: (cb) => {
        getToken().then((t) => cb({ token: t ?? '' }));
      },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket'],
    });
  }
  return socket;
};

/** Resolves with the socket once it is connected (connecting it if needed). */
export const getSocket = async (): Promise<GameSocket> => {
  if (socket?.connected) return socket;

  const token = await getToken();
  if (!token) throw new Error('Pas de token disponible pour le socket.');
  ensureSocket();

  return new Promise<GameSocket>((resolve, reject) => {
    if (!socket) return reject(new Error('Socket non initialisé.'));
    const onConnect = () => {
      socket!.off('connect_error', onError);
      resolve(socket!);
    };
    const onError = (err: Error) => {
      socket!.off('connect', onConnect);
      reject(err);
    };
    socket.once('connect', onConnect);
    socket.once('connect_error', onError);
    socket.connect();
  });
};

/** The current socket if one exists — never creates or connects one. */
export const peekSocket = (): GameSocket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
