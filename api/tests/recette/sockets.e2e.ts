/**
 * Acceptance suite — real-time layer: real HTTP + socket.io server, real clients, real Postgres.
 * Run with: RECETTE_DATABASE_URL=postgresql://… npm run recette
 */
jest.mock('../../src/lib/mailer', () => ({ isMailConfigured: () => true, sendMail: jest.fn(async () => undefined) }));

import http from 'http';
import { AddressInfo } from 'net';
import request from 'supertest';
import { io as connect, Socket } from 'socket.io-client';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { attachSockets } from '../../src/sockets';
import { RECONNECT_GRACE_MS } from '../../src/sockets/gameRoom';
import { ClientToServerEvents, GameOverPayload, ServerToClientEvents } from '../../src/sockets/events';
import { GameAction, GameState } from '../../src/game/gameEngine';

type Client = Socket<ServerToClientEvents, ClientToServerEvents>;

const PASSWORD = 'Passw0rd!';
let server: http.Server;
let url: string;
const open: Client[] = [];

interface Agent {
  id: number;
  username: string;
  token: string;
}

const api = () => request(app);
const bearer = (a: Agent) => ({ Authorization: `Bearer ${a.token}` });

const signup = async (username: string, mmr = 0): Promise<Agent> => {
  const email = `${username.toLowerCase()}@sock.test`;
  await api().post('/api/auth/signup').send({ username, email, passwordCrea: PASSWORD });
  const logged = await api().post('/api/auth/login').send({ identifier: username, password: PASSWORD });
  if (mmr) await prisma.users.update({ where: { ID_User: logged.body.user.id }, data: { MMR: mmr } });
  return { id: logged.body.user.id, username, token: logged.body.token };
};

const befriend = async (a: Agent, b: Agent) => {
  await api().post('/api/friends/request').set(bearer(a)).send({ username: b.username });
  await api().post('/api/friends/request').set(bearer(b)).send({ username: a.username });
};

const client = (token: string): Promise<Client> =>
  new Promise((resolve, reject) => {
    const socket: Client = connect(url, { auth: { token }, transports: ['websocket'], reconnection: false, forceNew: true });
    open.push(socket);
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (err) => reject(err));
  });

const once = <E extends keyof ServerToClientEvents>(
  socket: Client,
  event: E,
  timeoutMs = 8000,
): Promise<Parameters<ServerToClientEvents[E]>[0]> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${String(event)}`)), timeoutMs);
    (socket as Socket).once(event as string, (payload: Parameters<ServerToClientEvents[E]>[0]) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });

/** Resolves true if the event does NOT arrive within the delay. */
const silent = (socket: Client, event: keyof ServerToClientEvents, delayMs: number): Promise<boolean> =>
  new Promise((resolve) => {
    const handler = () => {
      clearTimeout(timer);
      resolve(false);
    };
    const timer = setTimeout(() => {
      (socket as Socket).off(event as string, handler);
      resolve(true);
    }, delayMs);
    (socket as Socket).once(event as string, handler);
  });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Plays every turn with `pick` until the server announces the end of the match. */
const autoplay = (socket: Client, pick: (state: GameState) => GameAction): Promise<GameOverPayload> => {
  let state: GameState | null = null;
  socket.on('state:update', (p) => { state = p.state; });
  socket.on('match:resume', (p) => { state = p.state; });
  socket.on('turn:start', () => { if (state) socket.emit('game:action', pick(state)); });
  return once(socket, 'game:over', 50000);
};

const hunter = (s: GameState): GameAction => (s.player.ammo > 0 ? 'shoot' : 'reload');
/** Never defends: reloads while it can, otherwise fires. Loses to the hunter on round 6. */
const sittingDuck = (s: GameState): GameAction => (s.player.ammo < 3 ? 'reload' : 'shoot');

beforeAll(async () => {
  await prisma.guild.deleteMany({});
  await prisma.users.deleteMany({});
  server = http.createServer(app);
  attachSockets(server);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  url = `http://localhost:${(server.address() as AddressInfo).port}`;
});

afterEach(async () => {
  open.splice(0).forEach((s) => s.disconnect());
  await sleep(150);
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.$disconnect();
});

// ════════════════════════════════════════════════════════════════════════════
describe('1. Connexion', () => {
  it('refuse un token invalide ou révoqué', async () => {
    await expect(client('garbage')).rejects.toThrow('Token invalide.');
    const agent = await signup('Revoked');
    await prisma.users.update({ where: { ID_User: agent.id }, data: { tokenVersion: { increment: 1 } } });
    await expect(client(agent.token)).rejects.toThrow('Session expirée.');
  });

  it('refuse un joueur suspendu', async () => {
    const agent = await signup('Banni');
    await prisma.users.update({ where: { ID_User: agent.id }, data: { banned: true } });
    await expect(client(agent.token)).rejects.toThrow('Utilisateur invalide.');
  });
});

describe('1b. Suspension', () => {
  it('coupe la connexion en cours du joueur suspendu', async () => {
    const [admin, target] = [await signup('Modo'), await signup('Tricheur')];
    await prisma.roles.create({ data: { ID_User: admin.id, Role: 'admin' } });
    const socket = await client(target.token);
    const dropped = new Promise<string>((resolve) => socket.once('disconnect', resolve));
    await api().post(`/api/admin/users/${target.id}/ban`).set(bearer(admin)).send({ banned: true });
    expect(await dropped).toBe('io server disconnect');
    await expect(client(target.token)).rejects.toThrow();
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('2. Partie rapide de bout en bout', () => {
  it('apparie, arbitre, récompense et enregistre', async () => {
    const [ann, ben] = [await signup('Ann'), await signup('Ben')];
    const [a, b] = [await client(ann.token), await client(ben.token)];

    const foundA = once(a, 'match:found');
    const foundB = once(b, 'match:found');
    const overA = autoplay(a, hunter);
    const overB = autoplay(b, sittingDuck);
    a.emit('matchmaking:join', 'pvp_quick');
    b.emit('matchmaking:join', 'pvp_quick');

    expect(await foundA).toMatchObject({ mode: 'pvp_quick', opponent: { id: ben.id, username: 'Ben' } });
    expect(await foundB).toMatchObject({ opponent: { id: ann.id } });

    const [endA, endB] = await Promise.all([overA, overB]);
    expect(endA).toMatchObject({ outcome: 'won', mode: 'pvp_quick', rewards: { mmrDelta: 0, moneyDelta: 20, xpDelta: 50 } });
    expect(endB).toMatchObject({ outcome: 'lost', rewards: { mmrDelta: 0, moneyDelta: 5, xpDelta: 15 } });
    expect(endA.finalState.opponent.lives).toBe(0);
    expect(endA.finalState.round).toBe(6);

    await sleep(400); // results are persisted right after game:over
    const annRow = await prisma.users.findUnique({ where: { ID_User: ann.id } });
    expect(annRow).toMatchObject({ Money: 120, XP: 50, MMR: 0 });
    const history = await api().get('/api/games/me/history').set(bearer(ann));
    expect(history.body.games).toEqual([
      expect.objectContaining({ mode: 'pvp_quick', won: true, draw: false, rounds: 6, opponent: 'Ben', xpDelta: 50 }),
    ]);
    expect((await api().get(`/api/users/${ben.id}/profile`).set(bearer(ann))).body.profile.stats).toMatchObject({ wins: 0, losses: 1, total: 1 });
  });

  it('refuse une action illégale ou inconnue, et la file en double', async () => {
    const [u1, u2] = [await signup('Cleo'), await signup('Dan')];
    const [a, b] = [await client(u1.token), await client(u2.token)];
    const turn = once(a, 'turn:start');
    a.emit('matchmaking:join');
    b.emit('matchmaking:join');
    await turn;

    const illegal = once(a, 'error:message');
    a.emit('game:action', 'shoot'); // no ammo on the first turn
    expect(await illegal).toContain('illégale');

    const unknown = once(a, 'error:message');
    a.emit('game:action', 'nuke' as GameAction);
    expect(await unknown).toBe('Action inconnue.');

    const busy = once(a, 'error:message');
    a.emit('matchmaking:join');
    expect(await busy).toBe('Vous êtes déjà en partie.');

    const over = once(b, 'game:over');
    a.emit('game:leave');
    // Left before any turn was resolved: cancelled, nothing credited or recorded.
    expect(await over).toMatchObject({ outcome: 'opponent_forfeit', rewards: { moneyDelta: 0, xpDelta: 0 } });
    await sleep(300);
    expect(await prisma.gameHistory.count({ where: { ID_User: { in: [u1.id, u2.id] } } })).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('3. File classée', () => {
  it('interdite aux invités', async () => {
    const guest = await api().get('/api/auth/guest');
    const g = await client(guest.body.token);
    const refused = once(g, 'error:message');
    g.emit('matchmaking:join', 'pvp_ranked');
    expect(await refused).toBe('Le mode classé nécessite un compte.');
  });

  it("n'apparie pas deux niveaux trop éloignés, apparie deux niveaux proches et crédite le MMR", async () => {
    const [low, high, near] = [await signup('Low', 100), await signup('High', 1900), await signup('Near', 150)];
    const [l, h] = [await client(low.token), await client(high.token)];
    l.emit('matchmaking:join', 'pvp_ranked');
    h.emit('matchmaking:join', 'pvp_ranked');
    expect(await silent(l, 'match:found', 1500)).toBe(true);
    h.emit('matchmaking:leave');
    await once(h, 'matchmaking:status');

    const n = await client(near.token);
    const found = once(l, 'match:found');
    const overL = autoplay(l, hunter);
    const overN = autoplay(n, sittingDuck);
    n.emit('matchmaking:join', 'pvp_ranked');
    expect(await found).toMatchObject({ mode: 'pvp_ranked', opponent: { id: near.id } });

    const [endL, endN] = await Promise.all([overL, overN]);
    expect(endL.rewards).toEqual({ mmrDelta: 25, moneyDelta: 50, xpDelta: 75 });
    expect(endN.rewards).toEqual({ mmrDelta: -20, moneyDelta: 10, xpDelta: 23 });
    await sleep(400);
    expect((await prisma.users.findUnique({ where: { ID_User: low.id } }))!.MMR).toBe(125);
    expect((await prisma.users.findUnique({ where: { ID_User: near.id } }))!.MMR).toBe(130);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('4. Reconnexion', () => {
  it('la partie attend le joueur déconnecté, qui la reprend là où elle en est', async () => {
    const [u1, u2] = [await signup('Eli'), await signup('Fay')];
    let a = await client(u1.token);
    const b = await client(u2.token);

    const overB = autoplay(b, sittingDuck);
    const firstReveal = new Promise<void>((resolve) => {
      b.on('state:update', (p) => { if (p.state.round === 1) resolve(); });
    });
    a.on('turn:start', () => a.emit('game:action', 'reload'));
    a.emit('matchmaking:join');
    b.emit('matchmaking:join');
    await firstReveal;

    const status = once(b, 'opponent:status');
    a.disconnect();
    expect(await status).toEqual({ connected: false, graceMs: RECONNECT_GRACE_MS });

    await sleep(2000);
    a = connect(url, { auth: { token: u1.token }, transports: ['websocket'], reconnection: false, forceNew: true });
    open.push(a);
    const back = once(b, 'opponent:status');
    const resume = await once(a, 'match:resume');
    expect(resume).toMatchObject({ mode: 'pvp_quick', opponent: { id: u2.id, username: 'Fay' } });
    expect(resume.state.round).toBeGreaterThanOrEqual(1);
    expect(resume.state.player.lives).toBe(3);
    expect(await back).toEqual({ connected: true });

    const overA = autoplay(a, hunter);
    // The match plays on to a normal end: nobody is declared forfeit.
    const [endA, endB] = await Promise.all([overA, overB]);
    const mirror = { won: 'lost', lost: 'won', draw: 'draw' } as const;
    expect(['won', 'lost', 'draw']).toContain(endA.outcome);
    expect(endB.outcome).toBe(mirror[endA.outcome as keyof typeof mirror]);
  });

  it('forfait si le joueur ne revient pas avant la fin du délai', async () => {
    const [u1, u2] = [await signup('Gus'), await signup('Hal')];
    const [a, b] = [await client(u1.token), await client(u2.token)];
    const firstReveal = new Promise<void>((resolve) => {
      b.on('state:update', (p) => { if (p.state.round === 1) resolve(); });
    });
    // Both shield forever: the board alone can never end this match.
    a.on('turn:start', () => a.emit('game:action', 'shield'));
    b.on('turn:start', () => b.emit('game:action', 'shield'));
    a.emit('matchmaking:join');
    b.emit('matchmaking:join');
    await firstReveal;

    const over = once(b, 'game:over', RECONNECT_GRACE_MS + 8000);
    const started = Date.now();
    a.disconnect();
    const end = await over;
    expect(end.outcome).toBe('opponent_forfeit');
    expect(Date.now() - started).toBeGreaterThanOrEqual(RECONNECT_GRACE_MS - 500);
    expect(end.rewards.moneyDelta).toBe(20);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('5. Défi entre amis', () => {
  it("réservé aux amis ; accepté, il lance un duel amical sans gain ni trace", async () => {
    const [u1, u2, stranger] = [await signup('Ivy'), await signup('Jon'), await signup('Kim')];
    await befriend(u1, u2);
    const [a, b, s] = [await client(u1.token), await client(u2.token), await client(stranger.token)];

    const refused = once(a, 'error:message');
    a.emit('challenge:send', stranger.id);
    expect(await refused).toBe('Tu ne peux défier que tes amis.');
    expect(await silent(s, 'challenge:received', 500)).toBe(true);

    const received = once(b, 'challenge:received');
    a.emit('challenge:send', u2.id);
    expect(await received).toMatchObject({ from: { id: u1.id, username: 'Ivy' } });

    const foundA = once(a, 'match:found');
    const overA = autoplay(a, hunter);
    const overB = autoplay(b, sittingDuck);
    b.emit('challenge:accept', u1.id);
    expect(await foundA).toMatchObject({ mode: 'pvp_friendly', opponent: { id: u2.id } });

    const [endA] = await Promise.all([overA, overB]);
    expect(endA).toMatchObject({ outcome: 'won', mode: 'pvp_friendly', rewards: { mmrDelta: 0, moneyDelta: 0, xpDelta: 0 } });
    await sleep(400);
    expect(await prisma.gameHistory.count({ where: { ID_User: { in: [u1.id, u2.id] } } })).toBe(0);
    expect((await prisma.users.findUnique({ where: { ID_User: u1.id } }))!).toMatchObject({ Money: 100, XP: 0 });
  });

  it('refus, annulation et ami hors ligne', async () => {
    const [u1, u2] = [await signup('Lea'), await signup('Max')];
    await befriend(u1, u2);
    const a = await client(u1.token);

    const offline = once(a, 'challenge:closed');
    a.emit('challenge:send', u2.id);
    expect(await offline).toEqual({ userId: u2.id, reason: 'unavailable' });

    const b = await client(u2.token);
    let received = once(b, 'challenge:received');
    a.emit('challenge:send', u2.id);
    await received;
    const declined = once(a, 'challenge:closed');
    b.emit('challenge:decline', u1.id);
    expect(await declined).toEqual({ userId: u2.id, reason: 'declined' });

    received = once(b, 'challenge:received');
    a.emit('challenge:send', u2.id);
    await received;
    const cancelled = once(b, 'challenge:closed');
    a.emit('challenge:cancel', u2.id);
    expect(await cancelled).toEqual({ userId: u1.id, reason: 'cancelled' });

    // Accepting a challenge that no longer exists does nothing harmful.
    const gone = once(b, 'challenge:closed');
    b.emit('challenge:accept', u1.id);
    expect(await gone).toEqual({ userId: u1.id, reason: 'expired' });
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('6. Notifications en temps réel', () => {
  it('demande d\'ami, présence, message privé et chat de guilde arrivent sans rechargement', async () => {
    const [u1, u2] = [await signup('Nia'), await signup('Oto')];
    const b = await client(u2.token);

    const friendPing = once(b, 'social:update');
    await api().post('/api/friends/request').set(bearer(u1)).send({ username: 'Oto' });
    expect(await friendPing).toEqual({ kind: 'friends' });
    await api().post('/api/friends/request').set(bearer(u2)).send({ username: 'Nia' });

    // Presence: Oto is connected, Nia is not.
    expect((await api().get('/api/friends').set(bearer(u1))).body.friends[0]).toMatchObject({ username: 'Oto', online: true });
    expect((await api().get('/api/friends').set(bearer(u2))).body.friends[0]).toMatchObject({ username: 'Nia', online: false });

    const dm = once(b, 'dm:new');
    await api().post(`/api/messages/dm/${u2.id}`).set(bearer(u1)).send({ content: 'rendez-vous au QG' });
    expect(await dm).toMatchObject({ fromId: u1.id, message: { content: 'rendez-vous au QG', senderUsername: 'Nia' } });

    await prisma.users.update({ where: { ID_User: u1.id }, data: { Money: 5000 } });
    const guild = await api().post('/api/guilds').set(bearer(u1)).send({ name: 'Signal', tag: 'SIG' });
    await api().post(`/api/guilds/${guild.body.guild.id}/join`).set(bearer(u2));
    const chat = once(b, 'guild:message');
    await api().post('/api/guilds/me/messages').set(bearer(u1)).send({ content: 'briefing à 20h' });
    expect(await chat).toMatchObject({ message: { content: 'briefing à 20h', senderUsername: 'Nia' } });

    const guildPing = once(b, 'social:update');
    await api().post(`/api/guilds/members/${u2.id}/role`).set(bearer(u1)).send({ role: 'OFFICER' });
    expect(await guildPing).toEqual({ kind: 'guild' });
  });
});
