/**
 * Acceptance suite — REST API against a real Postgres database.
 * Run with: RECETTE_DATABASE_URL=postgresql://… npm run recette
 */
const mails: { to: string; subject: string; text: string }[] = [];
jest.mock('../../src/lib/mailer', () => ({
  isMailConfigured: () => true,
  sendMail: jest.fn(async (to: string, subject: string, text: string) => {
    mails.push({ to, subject, text });
  }),
}));

import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { recordGame } from '../../src/services/games.service';
import { deleteMarkedUsers, purgeExpiredTokens, purgeStaleGuests, rotateShop } from '../../src/jobs/cronJobs';

const PASSWORD = 'Passw0rd!';
const NEW_PASSWORD = 'N3wPassw0rd!';

interface Agent {
  id: number;
  username: string;
  email: string;
  token: string;
}

const api = () => request(app);
const auth = (a: Agent) => ({ Authorization: `Bearer ${a.token}` });

const lastCode = (to: string): string => {
  const mail = [...mails].reverse().find((m) => m.to === to);
  if (!mail) throw new Error(`no mail for ${to}`);
  const match = mail.text.match(/code[^:]*: ([A-Z0-9]{8})/);
  if (!match) throw new Error(`no code in mail: ${mail.text}`);
  return match[1];
};

const signup = async (username: string): Promise<Agent> => {
  const email = `${username.toLowerCase()}@recette.test`;
  const created = await api().post('/api/auth/signup').send({ username, email, passwordCrea: PASSWORD });
  expect(created.status).toBe(201);
  const logged = await api().post('/api/auth/login').send({ identifier: username, password: PASSWORD });
  expect(logged.status).toBe(200);
  return { id: logged.body.user.id, username, email, token: logged.body.token };
};

const login = async (identifier: string, password: string) =>
  api().post('/api/auth/login').send({ identifier, password });

let alice: Agent;
let bob: Agent;
let carol: Agent;

beforeAll(async () => {
  // Disposable database: start from no player at all (cosmetics and missions come from the seed).
  await prisma.guild.deleteMany({});
  await prisma.users.deleteMany({});
  alice = await signup('Alice');
  bob = await signup('Bob');
  carol = await signup('Carol');
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ════════════════════════════════════════════════════════════════════════════
describe('1. Compte', () => {
  it('le profil expose XP, niveau et état de vérification', async () => {
    const res = await api().get('/api/users/me').set(auth(alice));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ username: 'Alice', xp: 0, level: 1, emailVerified: false, guest: false });
    expect(res.body.Password).toBeUndefined();
  });

  it('la connexion par e-mail ignore la casse', async () => {
    const res = await login('ALICE@Recette.Test', PASSWORD);
    expect(res.status).toBe(200);
  });

  it('mot de passe oublié : même réponse pour une adresse inconnue, sans e-mail envoyé', async () => {
    const before = mails.length;
    const res = await api().post('/api/auth/password/forgot').send({ email: 'nobody@recette.test' });
    expect(res.status).toBe(200);
    expect(mails.length).toBe(before);
  });

  it('réinitialisation : mauvais code refusé, bon code accepté, anciennes sessions fermées', async () => {
    const forgot = await api().post('/api/auth/password/forgot').send({ email: carol.email });
    expect(forgot.status).toBe(200);
    const code = lastCode(carol.email);

    const wrong = await api().post('/api/auth/password/reset').send({ email: carol.email, code: 'AAAAAAAA', password: NEW_PASSWORD });
    expect(wrong.status).toBe(400);

    const weak = await api().post('/api/auth/password/reset').send({ email: carol.email, code, password: 'weak' });
    expect(weak.status).toBe(400);

    const ok = await api().post('/api/auth/password/reset').send({ email: carol.email, code, password: NEW_PASSWORD });
    expect(ok.status).toBe(200);

    // The token obtained before the reset is revoked.
    expect((await api().get('/api/users/me').set(auth(carol))).status).toBe(401);
    expect((await login('Carol', PASSWORD)).status).toBe(401);

    const relog = await login('Carol', NEW_PASSWORD);
    expect(relog.status).toBe(200);
    expect(relog.body.user.emailVerified).toBe(true);
    carol.token = relog.body.token;

    // A code is single-use.
    const replay = await api().post('/api/auth/password/reset').send({ email: carol.email, code, password: PASSWORD });
    expect(replay.status).toBe(400);
  });

  it('un code est verrouillé après 5 essais ratés', async () => {
    await api().post('/api/auth/password/forgot').send({ email: bob.email });
    const code = lastCode(bob.email);
    for (let i = 0; i < 5; i++) {
      const res = await api().post('/api/auth/password/reset').send({ email: bob.email, code: 'BBBBBBBB', password: NEW_PASSWORD });
      expect(res.status).toBe(400);
    }
    const locked = await api().post('/api/auth/password/reset').send({ email: bob.email, code, password: NEW_PASSWORD });
    expect(locked.status).toBe(400);
    expect((await login('Bob', PASSWORD)).status).toBe(200);
  });

  it('changement de mot de passe : garde la session courante, ferme les autres', async () => {
    const other = (await login('Alice', PASSWORD)).body.token as string;

    const wrong = await api().post('/api/users/change-password').set(auth(alice)).send({ currentPassword: 'nope', newPassword: NEW_PASSWORD });
    expect(wrong.status).toBe(400);

    const ok = await api().post('/api/users/change-password').set(auth(alice)).send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
    expect(ok.status).toBe(200);
    expect(typeof ok.body.token).toBe('string');

    expect((await api().get('/api/users/me').set({ Authorization: `Bearer ${other}` })).status).toBe(401);
    alice.token = ok.body.token;
    expect((await api().get('/api/users/me').set(auth(alice))).status).toBe(200);
    expect((await login('Alice', NEW_PASSWORD)).status).toBe(200);
  });

  it("vérification d'e-mail par code", async () => {
    expect((await api().post('/api/users/email/send').set(auth(alice))).status).toBe(200);
    const code = lastCode(alice.email);
    expect((await api().post('/api/users/email/verify').set(auth(alice)).send({ code: 'ZZZZZZZZ' })).status).toBe(400);
    expect((await api().post('/api/users/email/verify').set(auth(alice)).send({ code })).status).toBe(200);
    expect((await api().get('/api/users/me').set(auth(alice))).body.emailVerified).toBe(true);
    expect((await api().post('/api/users/email/send').set(auth(alice))).status).toBe(400);
  });

  it('un invité devient un compte en gardant son identifiant', async () => {
    const guest = await api().get('/api/auth/guest');
    expect(guest.status).toBe(201);
    const guestAuth = { Authorization: `Bearer ${guest.body.token}` };

    const taken = await api().post('/api/users/upgrade-guest').set(guestAuth).send({ username: 'Alice', email: 'dave@recette.test', passwordCrea: PASSWORD });
    expect(taken.status).toBe(400);

    const up = await api().post('/api/users/upgrade-guest').set(guestAuth).send({ username: 'Dave', email: 'dave@recette.test', passwordCrea: PASSWORD });
    expect(up.status).toBe(200);
    expect(up.body.user).toMatchObject({ id: guest.body.user.id, username: 'Dave', guest: false });

    expect((await api().get('/api/users/me').set(guestAuth)).status).toBe(401);
    const me = await api().get('/api/users/me').set({ Authorization: `Bearer ${up.body.token}` });
    expect(me.body.guest).toBe(false);
    expect((await login('Dave', PASSWORD)).status).toBe(200);

    const again = await api().post('/api/users/upgrade-guest').set({ Authorization: `Bearer ${up.body.token}` }).send({ username: 'Dave2', email: 'dave2@recette.test', passwordCrea: PASSWORD });
    expect(again.status).toBe(400);
  });

  it('la déconnexion révoque le token', async () => {
    const session = await login('Dave', PASSWORD);
    const header = { Authorization: `Bearer ${session.body.token}` };
    expect((await api().post(`/api/auth/logout/${session.body.user.id}`).set(header)).status).toBe(200);
    expect((await api().get('/api/users/me').set(header)).status).toBe(401);
  });

  it("on ne peut pas déconnecter quelqu'un d'autre", async () => {
    expect((await api().post(`/api/auth/logout/${bob.id}`).set(auth(alice))).status).toBe(403);
    expect((await api().post(`/api/auth/logout/${bob.id}`)).status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('2. Social', () => {
  it('recherche de joueurs', async () => {
    expect((await api().get('/api/users/search?q=a').set(auth(bob))).status).toBe(400);
    const res = await api().get('/api/users/search?q=ali').set(auth(bob));
    expect(res.status).toBe(200);
    expect(res.body.players).toEqual([expect.objectContaining({ username: 'Alice', relation: 'none', online: false })]);
    // Never lists yourself.
    expect((await api().get('/api/users/search?q=bob').set(auth(bob))).body.players).toEqual([]);
  });

  it("pas de message tant qu'on n'est pas amis", async () => {
    const res = await api().post(`/api/messages/dm/${bob.id}`).set(auth(alice)).send({ content: 'salut' });
    expect(res.status).toBe(403);
  });

  it('demande, doublon, acceptation', async () => {
    const sent = await api().post('/api/friends/request').set(auth(alice)).send({ username: 'bob' });
    expect(sent.status).toBe(201);
    expect(sent.body.status).toBe('pending');

    expect((await api().post('/api/friends/request').set(auth(alice)).send({ username: 'Bob' })).status).toBe(400);
    // A pending request does not open messaging.
    expect((await api().post(`/api/messages/dm/${bob.id}`).set(auth(alice)).send({ content: 'salut' })).status).toBe(403);

    const aliceList = await api().get('/api/friends').set(auth(alice));
    expect(aliceList.body.friends).toEqual([]);
    expect(aliceList.body.outgoing).toHaveLength(1);

    const bobList = await api().get('/api/friends').set(auth(bob));
    expect(bobList.body.incoming).toHaveLength(1);
    const requestId = bobList.body.incoming[0].requestId;

    // Only the recipient can accept.
    expect((await api().post(`/api/friends/requests/${requestId}/accept`).set(auth(alice))).status).toBe(404);
    expect((await api().post(`/api/friends/requests/${requestId}/accept`).set(auth(bob))).status).toBe(200);

    for (const who of [alice, bob]) {
      const list = await api().get('/api/friends').set(auth(who));
      expect(list.body.friends).toHaveLength(1);
      expect(list.body.incoming).toEqual([]);
      expect(list.body.outgoing).toEqual([]);
    }
    expect((await api().get('/api/users/search?q=ali').set(auth(bob))).body.players[0].relation).toBe('friend');
  });

  it('messages privés : envoi, pagination, non-lus', async () => {
    for (let i = 1; i <= 35; i++) {
      const res = await api().post(`/api/messages/dm/${bob.id}`).set(auth(alice)).send({ content: `message ${i}` });
      expect(res.status).toBe(201);
    }
    expect((await api().post(`/api/messages/dm/${bob.id}`).set(auth(alice)).send({ content: '   ' })).status).toBe(400);
    expect((await api().post(`/api/messages/dm/${bob.id}`).set(auth(alice)).send({ content: 'x'.repeat(501) })).status).toBe(400);

    const inbox = await api().get('/api/messages/inbox').set(auth(bob));
    expect(inbox.body.inbox).toEqual([
      expect.objectContaining({ friendId: alice.id, friendUsername: 'Alice', lastMessage: 'message 35', unreadCount: 35 }),
    ]);

    const page1 = await api().get(`/api/messages/dm/${alice.id}`).set(auth(bob));
    expect(page1.body.messages).toHaveLength(30);
    expect(page1.body.hasMore).toBe(true);
    expect(page1.body.messages[0].content).toBe('message 6');
    expect(page1.body.messages[29].content).toBe('message 35');

    const page2 = await api().get(`/api/messages/dm/${alice.id}?before=${page1.body.messages[0].id}`).set(auth(bob));
    expect(page2.body.messages.map((m: { content: string }) => m.content)).toEqual(
      ['message 1', 'message 2', 'message 3', 'message 4', 'message 5'],
    );
    expect(page2.body.hasMore).toBe(false);

    expect((await api().get('/api/messages/inbox').set(auth(bob))).body.inbox[0].unreadCount).toBe(0);
  });

  it("retirer un ami ferme la messagerie ; une demande croisée s'accepte toute seule", async () => {
    expect((await api().delete(`/api/friends/${alice.id}`).set(auth(bob))).status).toBe(200);
    expect((await api().post(`/api/messages/dm/${bob.id}`).set(auth(alice)).send({ content: 'encore là ?' })).status).toBe(403);
    expect((await api().get('/api/friends').set(auth(alice))).body.friends).toEqual([]);

    expect((await api().post('/api/friends/request').set(auth(bob)).send({ username: 'Alice' })).body.status).toBe('pending');
    const crossed = await api().post('/api/friends/request').set(auth(alice)).send({ username: 'Bob' });
    expect(crossed.body.status).toBe('accepted');
    expect((await api().get('/api/friends').set(auth(bob))).body.friends).toHaveLength(1);
  });

  it('refuser et annuler une demande', async () => {
    await api().post('/api/friends/request').set(auth(carol)).send({ username: 'Bob' });
    const incoming = (await api().get('/api/friends').set(auth(bob))).body.incoming;
    expect((await api().delete(`/api/friends/requests/${incoming[0].requestId}`).set(auth(bob))).status).toBe(200);
    expect((await api().get('/api/friends').set(auth(carol))).body.outgoing).toEqual([]);

    await api().post('/api/friends/request').set(auth(carol)).send({ username: 'Bob' });
    const outgoing = (await api().get('/api/friends').set(auth(carol))).body.outgoing;
    expect((await api().delete(`/api/friends/requests/${outgoing[0].requestId}`).set(auth(carol))).status).toBe(200);
    expect((await api().get('/api/friends').set(auth(bob))).body.incoming).toEqual([]);
  });

  it('blocage : invisible dans les deux sens', async () => {
    expect((await api().post(`/api/friends/block/${carol.id}`).set(auth(carol))).status).toBe(400);
    expect((await api().post(`/api/friends/block/${alice.id}`).set(auth(carol))).status).toBe(200);
    // Blocking twice is harmless.
    expect((await api().post(`/api/friends/block/${alice.id}`).set(auth(carol))).status).toBe(200);

    expect((await api().get('/api/users/search?q=car').set(auth(alice))).body.players).toEqual([]);
    expect((await api().get('/api/users/search?q=ali').set(auth(carol))).body.players).toEqual([]);
    expect((await api().post('/api/friends/request').set(auth(alice)).send({ username: 'Carol' })).status).toBe(404);
    expect((await api().get(`/api/users/${carol.id}/profile`).set(auth(alice))).status).toBe(404);

    expect((await api().get('/api/friends/blocked').set(auth(carol))).body.blocked).toEqual([{ id: alice.id, username: 'Alice' }]);
    expect((await api().get('/api/friends/blocked').set(auth(alice))).body.blocked).toEqual([]);

    expect((await api().delete(`/api/friends/block/${alice.id}`).set(auth(carol))).status).toBe(200);
    expect((await api().get('/api/users/search?q=car').set(auth(alice))).body.players).toHaveLength(1);
  });

  it('bloquer un ami met fin à l\'amitié', async () => {
    await api().post('/api/friends/request').set(auth(carol)).send({ username: 'Alice' });
    const req = (await api().get('/api/friends').set(auth(alice))).body.incoming[0];
    await api().post(`/api/friends/requests/${req.requestId}/accept`).set(auth(alice));
    expect((await api().get('/api/friends').set(auth(carol))).body.friends).toHaveLength(1);

    await api().post(`/api/friends/block/${alice.id}`).set(auth(carol));
    expect((await api().get('/api/friends').set(auth(carol))).body.friends).toEqual([]);
    expect((await api().get('/api/friends').set(auth(alice))).body.friends.map((f: { username: string }) => f.username)).toEqual(['Bob']);
    await api().delete(`/api/friends/block/${alice.id}`).set(auth(carol));
  });

  it('profil public', async () => {
    const res = await api().get(`/api/users/${bob.id}/profile`).set(auth(alice));
    expect(res.status).toBe(200);
    expect(res.body.profile).toMatchObject({
      username: 'Bob', level: 1, relation: 'friend', guild: null,
      stats: { wins: 0, losses: 0, total: 0, winRate: 0 },
    });
    expect(res.body.profile.email).toBeUndefined();
    expect((await api().get('/api/users/999999/profile').set(auth(alice))).status).toBe(404);
  });

  it('signalement : validé, dédoublonné', async () => {
    expect((await api().post('/api/reports').set(auth(alice)).send({ targetId: alice.id, reason: 'spam' })).status).toBe(400);
    expect((await api().post('/api/reports').set(auth(alice)).send({ targetId: bob.id, reason: 'nimporte' })).status).toBe(400);
    const first = await api().post('/api/reports').set(auth(alice)).send({ targetId: bob.id, reason: 'cheating', details: 'tire trop vite' });
    expect(first.status).toBe(201);
    const second = await api().post('/api/reports').set(auth(alice)).send({ targetId: bob.id, reason: 'spam' });
    expect(second.body.id).toBe(first.body.id);
    expect(await prisma.report.count()).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('3. Modération', () => {
  it('réservée au rôle admin', async () => {
    expect((await api().get('/api/admin/reports').set(auth(alice))).status).toBe(403);
    expect((await api().post(`/api/admin/users/${bob.id}/ban`).set(auth(alice)).send({ banned: true })).status).toBe(403);
  });

  it('un admin traite un signalement et suspend un joueur', async () => {
    await prisma.roles.create({ data: { ID_User: carol.id, Role: 'admin' } });

    const reports = await api().get('/api/admin/reports').set(auth(carol));
    expect(reports.status).toBe(200);
    expect(reports.body.reports).toEqual([
      expect.objectContaining({ reason: 'cheating', reporter: { id: alice.id, username: 'Alice' }, target: { id: bob.id, username: 'Bob', banned: false } }),
    ]);

    expect((await api().post(`/api/admin/users/${bob.id}/ban`).set(auth(carol)).send({ banned: true })).status).toBe(200);
    expect((await api().get('/api/users/me').set(auth(bob))).status).toBe(401);
    expect((await login('Bob', PASSWORD)).status).toBe(403);
    expect((await api().get('/api/users/search?q=bob').set(auth(alice))).body.players).toEqual([]);

    expect((await api().post(`/api/admin/reports/${reports.body.reports[0].id}/resolve`).set(auth(carol))).status).toBe(200);
    expect((await api().get('/api/admin/reports').set(auth(carol))).body.reports).toEqual([]);
    expect((await api().get('/api/admin/reports?status=resolved').set(auth(carol))).body.reports).toHaveLength(1);

    expect((await api().post(`/api/admin/users/${bob.id}/ban`).set(auth(carol)).send({ banned: false })).status).toBe(200);
    const relog = await login('Bob', PASSWORD);
    expect(relog.status).toBe(200);
    bob.token = relog.body.token;
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('4. Guildes', () => {
  it('création payante, réservée à qui a les pièces', async () => {
    const broke = await api().post('/api/guilds').set(auth(alice)).send({ name: 'Les Ombres', tag: 'OMB' });
    expect(broke.status).toBe(402);

    await prisma.users.update({ where: { ID_User: alice.id }, data: { Money: 5000 } });
    const created = await api().post('/api/guilds').set(auth(alice)).send({ name: 'Les Ombres', tag: 'omb', description: 'Agents de nuit' });
    expect(created.status).toBe(201);
    expect(created.body.guild).toMatchObject({ name: 'Les Ombres', tag: 'OMB', myRole: 'LEADER', memberCount: 1 });
    expect((await prisma.users.findUnique({ where: { ID_User: alice.id } }))!.Money).toBe(0);
  });

  it('rejoindre, promouvoir, permissions', async () => {
    const guildId = (await api().get('/api/guilds/me').set(auth(alice))).body.guild.id;
    expect((await api().post(`/api/guilds/${guildId}/join`).set(auth(bob))).status).toBe(200);

    // A plain member manages nothing.
    expect((await api().post(`/api/guilds/members/${alice.id}/role`).set(auth(bob)).send({ role: 'MEMBER' })).status).toBe(403);
    expect((await api().patch('/api/guilds/me').set(auth(bob)).send({ isOpen: false })).status).toBe(403);
    expect((await api().post('/api/guilds/invites').set(auth(bob)).send({ username: 'Carol' })).status).toBe(403);

    const promoted = await api().post(`/api/guilds/members/${bob.id}/role`).set(auth(alice)).send({ role: 'OFFICER' });
    expect(promoted.status).toBe(200);
    expect(promoted.body.guild.members.find((m: { userId: number }) => m.userId === bob.id).role).toBe('OFFICER');
    expect((await api().post(`/api/guilds/members/${bob.id}/role`).set(auth(alice)).send({ role: 'LEADER' })).status).toBe(400);
    expect((await api().post(`/api/guilds/members/${alice.id}/role`).set(auth(alice)).send({ role: 'MEMBER' })).status).toBe(400);
  });

  it('guilde fermée : entrée sur invitation uniquement', async () => {
    const edited = await api().patch('/api/guilds/me').set(auth(alice)).send({ isOpen: false, description: 'Sur invitation' });
    expect(edited.status).toBe(200);
    expect(edited.body.guild).toMatchObject({ isOpen: false, description: 'Sur invitation' });

    const guildId = edited.body.guild.id;
    expect((await api().post(`/api/guilds/${guildId}/join`).set(auth(carol))).status).toBe(403);

    expect((await api().post('/api/guilds/invites').set(auth(bob)).send({ username: 'carol' })).status).toBe(201);
    expect((await api().post('/api/guilds/invites').set(auth(bob)).send({ username: 'Alice' })).status).toBe(409);

    const invites = await api().get('/api/guilds/invites').set(auth(carol));
    expect(invites.body.invites).toEqual([
      expect.objectContaining({ invitedBy: 'Bob', guild: expect.objectContaining({ name: 'Les Ombres', memberCount: 2 }) }),
    ]);
    // Somebody else's invitation cannot be used.
    expect((await api().post(`/api/guilds/invites/${invites.body.invites[0].id}/accept`).set(auth(alice))).status).toBe(404);

    const joined = await api().post(`/api/guilds/invites/${invites.body.invites[0].id}/accept`).set(auth(carol));
    expect(joined.status).toBe(200);
    expect(joined.body.guild).toMatchObject({ memberCount: 3, myRole: 'MEMBER' });
    expect((await api().get('/api/guilds/invites').set(auth(carol))).body.invites).toEqual([]);
  });

  it('chat de guilde paginé, fermé aux non-membres', async () => {
    for (let i = 1; i <= 45; i++) {
      const res = await api().post('/api/guilds/me/messages').set(auth(i % 2 ? alice : bob)).send({ content: `ordre ${i}` });
      expect(res.status).toBe(201);
    }
    const page1 = await api().get('/api/guilds/me/messages').set(auth(carol));
    expect(page1.body.messages).toHaveLength(40);
    expect(page1.body.hasMore).toBe(true);
    expect(page1.body.messages[39]).toMatchObject({ content: 'ordre 45', senderUsername: 'Alice' });

    const page2 = await api().get(`/api/guilds/me/messages?before=${page1.body.messages[0].id}`).set(auth(carol));
    expect(page2.body.messages).toHaveLength(5);
    expect(page2.body.hasMore).toBe(false);

    const outsider = await signup('Eve');
    expect((await api().get('/api/guilds/me/messages').set(auth(outsider))).status).toBe(404);
    expect((await api().post('/api/guilds/me/messages').set(auth(outsider)).send({ content: 'coucou' })).status).toBe(404);
  });

  it('expulsion, transfert du commandement, dissolution', async () => {
    // An officer cannot remove the leader; a member cannot remove anyone.
    expect((await api().delete(`/api/guilds/kick/${alice.id}`).set(auth(bob))).status).toBe(403);
    expect((await api().delete(`/api/guilds/kick/${bob.id}`).set(auth(carol))).status).toBe(403);
    expect((await api().delete(`/api/guilds/kick/${carol.id}`).set(auth(bob))).status).toBe(200);

    const transfer = await api().post(`/api/guilds/members/${bob.id}/transfer`).set(auth(alice));
    expect(transfer.status).toBe(200);
    expect(transfer.body.guild.myRole).toBe('OFFICER');
    expect((await api().get('/api/guilds/me').set(auth(bob))).body.guild.myRole).toBe('LEADER');

    expect((await api().delete('/api/guilds/me/dissolve').set(auth(alice))).status).toBe(403);
    expect((await api().delete('/api/guilds/me/dissolve').set(auth(bob))).status).toBe(200);
    expect((await api().get('/api/guilds/me').set(auth(alice))).body.guild).toBeNull();
    expect(await prisma.guildMessage.count()).toBe(0);
  });

  it("une guilde ne reste jamais sans chef quand son leader supprime son compte", async () => {
    const [chef, second, third] = [await signup('Chefdoomed'), await signup('Second'), await signup('Third')];
    await prisma.users.update({ where: { ID_User: chef.id }, data: { Money: 5000 } });
    const guild = (await api().post('/api/guilds').set(auth(chef)).send({ name: 'Orphelins', tag: 'ORP' })).body.guild;
    await api().post(`/api/guilds/${guild.id}/join`).set(auth(second));
    await api().post(`/api/guilds/${guild.id}/join`).set(auth(third));
    await api().post(`/api/guilds/members/${third.id}/role`).set(auth(chef)).send({ role: 'OFFICER' });

    expect((await api().put(`/api/users/deleteUser/${chef.id}`).set(auth(chef))).status).toBe(200);

    const after = (await api().get('/api/guilds/me').set(auth(second))).body.guild;
    expect(after.memberCount).toBe(2);
    // The officer inherits the guild, not the older plain member.
    expect(after.members.find((m: { role: string }) => m.role === 'LEADER').userId).toBe(third.id);

    // Last members gone: the empty guild disappears.
    await api().put(`/api/users/deleteUser/${second.id}`).set(auth(second));
    await api().put(`/api/users/deleteUser/${third.id}`).set(auth(third));
    expect(await prisma.guild.findUnique({ where: { id: guild.id } })).toBeNull();
  });

  it('liste paginée', async () => {
    for (let i = 0; i < 3; i++) {
      const leader = await signup(`Chef${i}`);
      await prisma.users.update({ where: { ID_User: leader.id }, data: { Money: 5000 } });
      expect((await api().post('/api/guilds').set(auth(leader)).send({ name: `Unite ${i}`, tag: `U${i}X` })).status).toBe(201);
    }
    const page1 = await api().get('/api/guilds?limit=2').set(auth(alice));
    expect(page1.body.guilds).toHaveLength(2);
    expect(page1.body.hasMore).toBe(true);
    const page2 = await api().get('/api/guilds?limit=2&offset=2').set(auth(alice));
    expect(page2.body.guilds).toHaveLength(1);
    expect(page2.body.hasMore).toBe(false);
    expect((await api().get('/api/guilds?search=unite%201').set(auth(alice))).body.guilds).toHaveLength(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('5. Jeu, progression, économie', () => {
  it("un client ne peut déclarer qu'une partie d'entraînement, sans gain", async () => {
    expect((await api().post('/api/games/result').set(auth(alice)).send({ outcome: 'won', mode: 'pvp_ranked' })).status).toBe(400);
    const res = await api().post('/api/games/result').set(auth(alice)).send({ outcome: 'won', mode: 'pve', rounds: 7 });
    expect(res.status).toBe(201);
    const me = await api().get('/api/users/me').set(auth(alice));
    expect(me.body).toMatchObject({ mmr: 0, money: 0, xp: 0 });
  });

  it('une partie classée crédite MMR, pièces et XP ; un nul est un nul', async () => {
    const win = await recordGame({ userId: alice.id, outcome: 'won', mode: 'pvp_ranked', rounds: 5, opponentId: bob.id });
    expect(win).toMatchObject({ delta: 25, moneyDelta: 50, xpDelta: 75 });
    await recordGame({ userId: alice.id, outcome: 'draw', mode: 'pvp_quick', rounds: 9, opponentId: bob.id });
    await recordGame({ userId: bob.id, outcome: 'lost', mode: 'pvp_ranked', rounds: 5, opponentId: alice.id });

    const me = await api().get('/api/users/me').set(auth(alice));
    expect(me.body).toMatchObject({ mmr: 25, money: 60, xp: 100, level: 2 });

    const stats = await api().get('/api/games/me/stats').set(auth(alice));
    expect(stats.body.stats.ranked).toMatchObject({ wins: 1, draws: 0, losses: 0, total: 1 });
    expect(stats.body.stats.quick).toMatchObject({ wins: 0, draws: 1, losses: 0, total: 1 });
    // A defeat never pushes MMR below zero.
    expect((await api().get('/api/users/me').set(auth(bob))).body.mmr).toBe(0);
  });

  it('historique paginé avec adversaire', async () => {
    const page = await api().get('/api/games/me/history?limit=2').set(auth(alice));
    expect(page.status).toBe(200);
    expect(page.body.games).toHaveLength(2);
    expect(page.body.hasMore).toBe(true);
    expect(page.body.games[0]).toMatchObject({ mode: 'pvp_quick', draw: true, won: false, opponent: 'Bob', rounds: 9 });
    const rest = await api().get('/api/games/me/history?limit=2&offset=2').set(auth(alice));
    expect(rest.body.games).toEqual([expect.objectContaining({ mode: 'pve', opponent: null, mmrDelta: 0, xpDelta: 0 })]);
    expect(rest.body.hasMore).toBe(false);
  });

  it('classement paginé et position personnelle', async () => {
    const top = await api().get('/api/leaderboard?limit=1');
    expect(top.body.leaderboard).toEqual([expect.objectContaining({ position: 1, username: 'Alice', mmr: 25 })]);
    expect(top.body.hasMore).toBe(true);
    const next = await api().get('/api/leaderboard?limit=1&offset=1');
    expect(next.body.leaderboard[0].position).toBe(2);
    expect((await api().get('/api/leaderboard/me').set(auth(alice))).body.me).toMatchObject({ position: 1 });
    const bobPos = (await api().get('/api/leaderboard/me').set(auth(bob))).body.me.position;
    expect(bobPos).toBeGreaterThan(1);
    expect((await api().get('/api/leaderboard/me')).status).toBe(401);
  });

  it("missions : l'entraînement ne compte pas, la récompense XP est versée une seule fois", async () => {
    const daily = await api().get('/api/missions/daily').set(auth(carol));
    expect(daily.status).toBe(200);
    expect(daily.body.missions).toHaveLength(4);
    expect((await api().get('/api/missions/daily').set(auth(carol))).body.missions).toHaveLength(4);

    const mission = daily.body.missions.find((m: { metric: string }) => m.metric === 'wins' || m.metric === 'rounds_played') ?? daily.body.missions[0];
    expect((await api().post(`/api/missions/daily/${mission.id}/claim`).set(auth(carol))).status).toBe(422);

    // Training games must not move mission progress.
    for (let i = 0; i < mission.target; i++) {
      await api().post('/api/games/result').set(auth(carol)).send({ outcome: 'won', mode: 'pve' });
    }
    expect((await api().post(`/api/missions/daily/${mission.id}/claim`).set(auth(carol))).status).toBe(422);

    const mode = mission.metric.startsWith('ranked') ? 'pvp_ranked' : 'pvp_quick';
    for (let i = 0; i < mission.target; i++) {
      await recordGame({ userId: carol.id, outcome: 'won', mode, rounds: 4, opponentId: alice.id });
    }
    const xpBefore = (await api().get('/api/users/me').set(auth(carol))).body.xp;

    // Two simultaneous claims: exactly one is paid.
    const [c1, c2] = await Promise.all([
      api().post(`/api/missions/daily/${mission.id}/claim`).set(auth(carol)),
      api().post(`/api/missions/daily/${mission.id}/claim`).set(auth(carol)),
    ]);
    expect([c1.status, c2.status].sort()).toEqual([200, 409]);
    const xpAfter = (await api().get('/api/users/me').set(auth(carol))).body.xp;
    expect(xpAfter - xpBefore).toBe(mission.xpReward);

    // Nobody can claim another player's mission.
    expect((await api().post(`/api/missions/daily/${mission.id}/claim`).set(auth(alice))).status).toBe(404);
  });

  it('boutique : deux achats simultanés ne dépensent pas deux fois les mêmes pièces', async () => {
    const shop = await api().get('/api/shop').set(auth(bob));
    expect(shop.status).toBe(200);
    const [a, b] = shop.body.offers.filter((o: { price: number }) => o.price > 0);
    const budget = Math.max(a.price, b.price);
    await prisma.users.update({ where: { ID_User: bob.id }, data: { Money: budget } });

    const [r1, r2] = await Promise.all([
      api().post(`/api/shop/purchase/${a.offerId}`).set(auth(bob)),
      api().post(`/api/shop/purchase/${b.offerId}`).set(auth(bob)),
    ]);
    const paid = [r1, r2].filter((r) => r.status === 201);
    const money = (await prisma.users.findUnique({ where: { ID_User: bob.id } }))!.Money;
    expect(money).toBeGreaterThanOrEqual(0);
    expect(paid.length).toBeGreaterThanOrEqual(1);
    const spent = paid.reduce((sum, r) => sum + r.body.result.pricePaid, 0);
    expect(money).toBe(budget - spent);
    expect(await prisma.userCosmetic.count({ where: { userId: bob.id, pricePaid: { gt: 0 } } })).toBe(paid.length);
  });

  it('un invité ne peut ni acheter ni fonder de guilde', async () => {
    const guest = await api().get('/api/auth/guest');
    const header = { Authorization: `Bearer ${guest.body.token}` };
    const offer = (await api().get('/api/shop').set(header)).body.offers[0];
    expect((await api().post(`/api/shop/purchase/${offer.offerId}`).set(header)).status).toBe(403);
    await prisma.users.update({ where: { ID_User: guest.body.user.id }, data: { Money: 9999 } });
    expect((await api().post('/api/guilds').set(header).send({ name: 'Invites', tag: 'INV' })).status).toBe(403);
    expect((await api().post('/api/friends/request').set(header).send({ username: 'Alice' })).status).toBe(403);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('6. Tâches planifiées', () => {
  it('rotation de la boutique : forcée à minuit, jamais au redémarrage', async () => {
    const before = (await prisma.shopOffer.findMany({ orderBy: { id: 'asc' } })).map((o) => o.id);
    await rotateShop();
    expect((await prisma.shopOffer.findMany({ orderBy: { id: 'asc' } })).map((o) => o.id)).toEqual(before);

    await rotateShop(true);
    const offers = await prisma.shopOffer.findMany({ include: { item: true } });
    expect(offers.map((o) => o.id)).not.toEqual(before);
    expect(offers.length).toBeGreaterThan(0);
    expect(offers.length).toBeLessThanOrEqual(9);
    expect(offers.filter((o) => o.item.type === 'ui_theme')).toHaveLength(1);
    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0);
    expect(offers.every((o) => o.validUntil.getTime() === midnight.getTime())).toBe(true);

    // An expired shop is refilled by the non-forced run (server restarted after midnight).
    await prisma.shopOffer.updateMany({ data: { validUntil: new Date(Date.now() - 1000) } });
    expect((await api().get('/api/shop').set(auth(alice))).body.offers).toEqual([]);
    await rotateShop();
    expect((await api().get('/api/shop').set(auth(alice))).body.offers.length).toBeGreaterThan(0);
  });

  it('purge des invités inactifs, des comptes supprimés et des codes expirés', async () => {
    const old = new Date(Date.now() - 8 * 24 * 3600 * 1000);
    const fresh = await api().get('/api/auth/guest');
    const stale = await api().get('/api/auth/guest');
    await prisma.users.update({ where: { ID_User: stale.body.user.id }, data: { CreatedAt: old } });
    await prisma.session.updateMany({ where: { ID_User: stale.body.user.id }, data: { LastConnection: old } });

    await purgeStaleGuests();
    expect(await prisma.users.findUnique({ where: { ID_User: stale.body.user.id } })).toBeNull();
    expect(await prisma.users.findUnique({ where: { ID_User: fresh.body.user.id } })).not.toBeNull();
    expect(await prisma.users.findUnique({ where: { ID_User: alice.id } })).not.toBeNull();

    const doomed = await signup('Fantome');
    expect((await api().put(`/api/users/deleteUser/${doomed.id}`).set(auth(doomed))).status).toBe(200);
    expect((await api().get('/api/users/me').set(auth(doomed))).status).toBe(401);
    await deleteMarkedUsers();
    expect(await prisma.users.findUnique({ where: { ID_User: doomed.id } })).not.toBeNull();
    await prisma.users.update({ where: { ID_User: doomed.id }, data: { deletionDate: new Date(Date.now() - 31 * 24 * 3600 * 1000) } });
    await deleteMarkedUsers();
    expect(await prisma.users.findUnique({ where: { ID_User: doomed.id } })).toBeNull();

    await prisma.accountToken.create({ data: { userId: alice.id, type: 'password_reset', codeHash: 'x', expiresAt: old } });
    await purgeExpiredTokens();
    expect(await prisma.accountToken.count({ where: { codeHash: 'x' } })).toBe(0);
  });
});
