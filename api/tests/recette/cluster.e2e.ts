/**
 * Acceptance suite — two API instances in a cluster (SOCKET_CLUSTER=postgres).
 *
 * Starts two real API processes on the recette database, connects players to
 * different instances, and checks that they meet, play, receive each other's
 * pushes, and keep their match when the coordinator instance dies.
 * Run with: RECETTE_DATABASE_URL=postgresql://… npm run recette
 */
import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import { io as connect, Socket } from 'socket.io-client';
import { prisma } from '../../src/lib/prisma';
import { ClientToServerEvents, ServerToClientEvents } from '../../src/sockets/events';

type Client = Socket<ServerToClientEvents, ClientToServerEvents>;

const PASSWORD = 'Passw0rd!';
const PORTS = [4201, 4202] as const;
const url = (port: number) => `http://localhost:${port}`;
const procs = new Map<number, ChildProcess>();
const open: Client[] = [];

jest.setTimeout(180_000);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const startInstance = async (port: number) => {
  const child = spawn('npx', ['ts-node', '--files', 'src/index.ts'], {
    cwd: path.resolve(__dirname, '../..'),
    env: { ...process.env, PORT: String(port), SOCKET_CLUSTER: 'postgres', NODE_ENV: 'test' },
    shell: true,
    stdio: 'ignore',
  });
  procs.set(port, child);
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`${url(port)}/api/ping/getPing`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  throw new Error(`instance ${port} did not start`);
};

/** Kills the whole process tree (npx → ts-node → node) of an instance. */
const killInstance = (port: number) => {
  const child = procs.get(port);
  if (!child?.pid) return;
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F']);
  else process.kill(-child.pid, 'SIGKILL');
  procs.delete(port);
};

const api = async (port: number, method: string, route: string, body?: unknown, token?: string) => {
  const res = await fetch(`${url(port)}/api${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
};

const signup = async (username: string) => {
  await api(PORTS[0], 'POST', '/auth/signup', {
    username,
    email: `${username.toLowerCase()}@cluster.test`,
    passwordCrea: PASSWORD,
    acceptTerms: true,
  });
  const logged = await api(PORTS[0], 'POST', '/auth/login', { identifier: username, password: PASSWORD });
  return { id: logged.body.user.id as number, username, token: logged.body.token as string };
};

/** Connects and resolves once connected; listeners attached by `once()` before that are kept. */
const client = (port: number, token: string): Client => {
  const socket: Client = connect(url(port), { auth: { token }, transports: ['websocket'], reconnection: false, forceNew: true });
  open.push(socket);
  return socket;
};

const once = <E extends keyof ServerToClientEvents>(
  socket: Client,
  event: E,
  timeoutMs = 15000,
): Promise<Parameters<ServerToClientEvents[E]>[0]> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${String(event)}`)), timeoutMs);
    (socket as Socket).once(event as string, (payload: Parameters<ServerToClientEvents[E]>[0]) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });

beforeAll(async () => {
  await prisma.liveMatch.deleteMany({});
  await prisma.guild.deleteMany({});
  await prisma.users.deleteMany({});
  // The first instance up wins the coordinator election.
  await startInstance(PORTS[0]);
  await startInstance(PORTS[1]);
});

afterAll(async () => {
  open.splice(0).forEach((s) => s.disconnect());
  PORTS.forEach(killInstance);
  await prisma.$disconnect();
});

describe('7. Plusieurs instances', () => {
  it('deux joueurs sur deux machines différentes se trouvent et jouent ; un message privé traverse le cluster', async () => {
    const [u1, u2] = [await signup('Alpha'), await signup('Bravo')];
    const a = client(PORTS[0], u1.token);
    const b = client(PORTS[1], u2.token);
    await Promise.all([once(a, 'connect' as never), once(b, 'connect' as never)]).catch(() => undefined);
    await sleep(500);

    // Friendship + DM sent through instance A, received by Bravo connected to B.
    await api(PORTS[0], 'POST', '/friends/request', { username: 'Bravo' }, u1.token);
    await api(PORTS[1], 'POST', '/friends/request', { username: 'Alpha' }, u2.token);
    await prisma.users.updateMany({ data: { emailVerified: true } });
    const dm = once(b, 'dm:new');
    expect((await api(PORTS[0], 'POST', `/messages/dm/${u2.id}`, { content: 'cross-instance' }, u1.token)).status).toBe(201);
    expect((await dm).fromId).toBe(u1.id);

    // Presence seen from the other instance.
    const friends = await api(PORTS[1], 'GET', '/friends', undefined, u2.token);
    expect(friends.body.friends?.[0]).toMatchObject({ username: 'Alpha', online: true });

    const [foundA, foundB] = [once(a, 'match:found'), once(b, 'match:found')];
    a.emit('matchmaking:join', 'pvp_quick');
    b.emit('matchmaking:join', 'pvp_quick');
    expect((await foundA).opponent.username).toBe('Bravo');
    expect((await foundB).opponent.username).toBe('Alpha');

    const reveal = once(b, 'state:update', 20000);
    await once(a, 'turn:start');
    a.emit('game:action', 'reload');
    b.emit('game:action', 'reload');
    // The initial state arrives first; wait for the resolved turn.
    let state = (await reveal).state;
    while (state.round < 1) state = (await once(b, 'state:update')).state;
    expect(state.round).toBe(1);
    a.emit('game:leave');
    await once(b, 'game:over');
  });

  it("si la machine coordinatrice tombe, une autre reprend la partie en cours", async () => {
    const [u1, u2] = [await signup('Charlie'), await signup('Delta')];
    const a = client(PORTS[0], u1.token); // on the coordinator
    const b = client(PORTS[1], u2.token); // on the follower
    await sleep(800);

    const [foundA, foundB] = [once(a, 'match:found'), once(b, 'match:found')];
    a.emit('matchmaking:join', 'pvp_quick');
    b.emit('matchmaking:join', 'pvp_quick');
    await Promise.all([foundA, foundB]);
    await once(a, 'turn:start');
    a.emit('game:action', 'reload');
    b.emit('game:action', 'reload');
    let state = (await once(b, 'state:update')).state;
    while (state.round < 1) state = (await once(b, 'state:update')).state;
    await sleep(500);
    expect(await prisma.liveMatch.count()).toBe(1);

    // The coordinator dies. Delta, still connected to the survivor, gets the match back
    // as soon as the survivor takes over; Charlie reconnects to the survivor.
    const resumeB = once(b, 'match:resume', 30000);
    killInstance(PORTS[0]);
    const resumedB = await resumeB;
    expect(resumedB).toMatchObject({ mode: 'pvp_quick', opponent: { username: 'Charlie' } });
    expect(resumedB.state.round).toBe(1);

    const a2 = client(PORTS[1], u1.token);
    const resumedA = await once(a2, 'match:resume', 20000);
    expect(resumedA.state.round).toBe(1);

    const [nextA, nextB] = await Promise.all([once(a2, 'turn:start', 20000), once(b, 'turn:start', 20000)]);
    expect(nextA.round).toBe(2);
    expect(nextB.round).toBe(2);
  });
});
