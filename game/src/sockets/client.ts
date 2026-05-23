import { io, Socket } from 'socket.io-client';
import { getToken } from '../stores/authStore';
import { ClientToServerEvents, ServerToClientEvents } from './events';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: GameSocket | null = null;

const baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ?? '';

/**
 * Get or create the singleton socket connection.
 * Connects lazily with the current JWT.
 */
export const getSocket = async (): Promise<GameSocket> => {
  if (socket?.connected) return socket;

  const token = await getToken();
  if (!token) throw new Error('Pas de token disponible pour le socket.');

  if (!socket) {
    socket = io(baseURL, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket'],
    });
  } else {
    socket.auth = { token };
  }

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

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
