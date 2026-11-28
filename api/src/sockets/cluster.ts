import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/postgres-adapter';
import pg from 'pg';
import { logger } from '../lib/logger';
import { ClientToServerEvents, ServerToClientEvents } from './events';
import { SocketData, SocketUser } from './auth';

/**
 * Running the API on several machines.
 *
 * Off by default: one process does everything. With SOCKET_CLUSTER=postgres,
 * every instance shares socket.io events through Postgres (LISTEN/NOTIFY — no
 * extra infrastructure), so a player connected to one machine can be reached
 * from any other one.
 *
 * Matchmaking queues, matches and friend challenges still need a single owner:
 * the instances elect a "coordinator" with a Postgres advisory lock. Followers
 * forward the game events of their players to it; it answers them directly
 * through the shared adapter. When the coordinator dies, its database session
 * ends, the lock is freed, another instance takes over and reloads the running
 * matches from the LiveMatch table (see gameRoom.restoreMatches).
 *
 * Needs a direct (non-pooled) Postgres connection: LISTEN does not go through
 * PgBouncer in transaction mode. SOCKET_CLUSTER_DATABASE_URL, else DIRECT_URL,
 * else DATABASE_URL.
 */

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export type GameEventKind =
  | 'connect'
  | 'disconnect'
  | 'matchmaking:join'
  | 'matchmaking:leave'
  | 'game:action'
  | 'game:leave'
  | 'challenge:send'
  | 'challenge:accept'
  | 'challenge:decline'
  | 'challenge:cancel';

interface Forwarded {
  kind: GameEventKind;
  socketId: string;
  user: SocketUser;
  payload: unknown;
}

export type GameEventHandler = (io: TypedServer, kind: GameEventKind, socket: TypedSocket, payload: unknown) => void;

const FORWARD_EVENT = 'ks:game-event';
/** Arbitrary but fixed: the advisory lock every instance competes for. */
const COORDINATOR_LOCK = 4_242_001;
const ELECTION_RETRY_MS = 3000;
const RECONCILE_MS = 15_000;

let role: 'single' | 'coordinator' | 'follower' = 'single';
let handler: GameEventHandler | null = null;

export const isCoordinator = () => role !== 'follower';

/** The game logic that runs on the coordinator (registered when sockets are attached). */
export const setGameEventHandler = (next: GameEventHandler) => {
  handler = next;
};
export const clusterRole = () => role;

/**
 * Stands for a client socket that may live on another instance: everything goes
 * through the shared adapter (emit to its id, join/leave by id).
 */
export const socketRef = (io: TypedServer, socketId: string, user: SocketUser): TypedSocket =>
  ({
    id: socketId,
    data: { user },
    emit: (event: string, ...args: unknown[]) => {
      (io.to(socketId) as unknown as { emit: (e: string, ...a: unknown[]) => void }).emit(event, ...args);
      return true;
    },
    join: (room: string) => io.in(socketId).socketsJoin(room),
    leave: (room: string) => io.in(socketId).socketsLeave(room),
  }) as unknown as TypedSocket;

/**
 * Entry point for every game event of a client connected to this instance:
 * handled here by the coordinator, forwarded to it otherwise.
 */
export const dispatchGameEvent = (
  io: TypedServer,
  kind: GameEventKind,
  socket: TypedSocket,
  payload?: unknown,
) => {
  if (isCoordinator()) {
    handler?.(io, kind, socket, payload);
    return;
  }
  const message: Forwarded = { kind, socketId: socket.id, user: socket.data.user!, payload };
  (io as unknown as Server).serverSideEmit(FORWARD_EVENT, message);
};

/** What the coordinator does when it takes over (first start, or a predecessor died). */
export type TakeOver = (io: TypedServer, connected: { socketId: string; user: SocketUser }[]) => Promise<void>;
/** Socket ids the coordinator believes connected, compared with reality now and then. */
export type Reconcile = (io: TypedServer, alive: Set<string>) => void;

export const startCluster = async (
  io: TypedServer,
  hooks: { takeOver: TakeOver; reconcile: Reconcile },
) => {

  if (process.env.SOCKET_CLUSTER !== 'postgres') {
    role = 'single';
    await hooks.takeOver(io, []);
    return;
  }

  const connectionString =
    process.env.SOCKET_CLUSTER_DATABASE_URL ?? process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString, max: 4 });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS socket_io_attachments (
      id          bigserial UNIQUE,
      created_at  timestamptz DEFAULT NOW(),
      payload     bytea
    );
  `);
  io.adapter(createAdapter(pool, { errorHandler: (err) => logger.error({ err }, 'socket cluster adapter error') }));
  role = 'follower';

  // Events forwarded by the followers: only the coordinator acts on them.
  (io as unknown as Server).on(FORWARD_EVENT, (message: Forwarded) => {
    if (role !== 'coordinator') return;
    handler?.(io, message.kind, socketRef(io, message.socketId, message.user), message.payload);
  });

  // The election runs on its own session: holding it open is holding the lock.
  const election = new pg.Client({ connectionString });
  await election.connect();
  election.on('error', (err) => {
    if (role === 'coordinator') {
      // Without its session the lock may already belong to someone else: stop at
      // once rather than run a second set of matches. The process manager restarts us.
      logger.fatal({ err }, 'coordinator lost its database session, exiting');
      process.exit(1);
    }
    logger.error({ err }, 'election session lost');
  });

  const tryLead = async () => {
    try {
      const { rows } = await election.query<{ locked: boolean }>('SELECT pg_try_advisory_lock($1) AS locked', [
        COORDINATOR_LOCK,
      ]);
      if (!rows[0]?.locked) {
        setTimeout(tryLead, ELECTION_RETRY_MS).unref();
        return;
      }
      role = 'coordinator';
      logger.info('this instance is now the game coordinator');
      const sockets = await io.fetchSockets();
      await hooks.takeOver(
        io,
        sockets.filter((s) => s.data.user).map((s) => ({ socketId: s.id, user: s.data.user! })),
      );
      setInterval(async () => {
        try {
          const alive = new Set((await io.fetchSockets()).map((s) => s.id));
          hooks.reconcile(io, alive);
        } catch (err) {
          logger.warn({ err }, 'socket reconcile skipped');
        }
      }, RECONCILE_MS).unref();
    } catch (err) {
      logger.error({ err }, 'coordinator election failed, retrying');
      setTimeout(tryLead, ELECTION_RETRY_MS).unref();
    }
  };
  await tryLead();
};

export const __test = {
  setRole: (next: typeof role) => {
    role = next;
  },
};
