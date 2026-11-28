import { io, Socket } from 'socket.io-client';
import { getToken } from '../stores/authStore';
import { refreshSession, sessionLost } from '../api/client';
import { ClientToServerEvents, ServerToClientEvents } from './events';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: GameSocket | null = null;

const baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ?? '';

/** Messages the server's socket middleware sends when the access token is not accepted. */
const AUTH_ERRORS = ['Session expirée.', 'Token invalide.', 'Token requis.'];
const isAuthError = (err: Error) => AUTH_ERRORS.includes(err.message);

const RETRY_AFTER_NETWORK_ERROR_MS = 5000;

/**
 * A refused handshake is not retried by socket.io on its own: renew the access
 * token and connect again. Waiters of getSocket() only hear the final outcome.
 */
type Waiter = { resolve: (s: GameSocket) => void; reject: (e: Error) => void };
let waiters: Waiter[] = [];

const settle = (outcome: { socket: GameSocket } | { error: Error }) => {
  const pending = waiters;
  waiters = [];
  pending.forEach((w) => ('socket' in outcome ? w.resolve(outcome.socket) : w.reject(outcome.error)));
};

const onConnectError = async (err: Error) => {
  const current = socket;
  if (!current) return;
  if (!isAuthError(err)) {
    // Server unreachable: socket.io keeps retrying by itself; callers waiting now give up.
    settle({ error: err });
    return;
  }
  const result = await refreshSession();
  if (socket !== current) return; // session changed meanwhile
  if (result === 'renewed') {
    current.connect();
  } else if (result === 'rejected') {
    settle({ error: err });
    await sessionLost();
  } else {
    settle({ error: err });
    setTimeout(() => {
      if (socket === current && !current.connected) current.connect();
    }, RETRY_AFTER_NETWORK_ERROR_MS);
  }
};

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
    const created = socket;
    created.on('connect', () => settle({ socket: created }));
    created.on('connect_error', (err) => void onConnectError(err));
  }
  return socket;
};

/** Resolves with the socket once it is connected (connecting it if needed). */
export const getSocket = async (): Promise<GameSocket> => {
  if (socket?.connected) return socket;

  const token = await getToken();
  if (!token) throw new Error('Pas de token disponible pour le socket.');
  const current = ensureSocket();

  return new Promise<GameSocket>((resolve, reject) => {
    waiters.push({ resolve, reject });
    if (!current.active) current.connect();
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
  settle({ error: new Error('Socket fermé.') });
};

/**
 * The server reads the account (guest, verified e-mail…) when the connection opens:
 * after such a change, reconnect the same socket — its listeners stay attached.
 */
export const reconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket.connect();
};
