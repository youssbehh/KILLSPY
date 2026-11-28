import { hash, compare } from 'bcrypt';

import { randomBytes } from 'crypto';
import { Users } from '@prisma/client';

import { prisma } from '../lib/prisma';
import { issueSession, revokeAllSessions } from './tokens.service';
import { HttpException, ErrCodes, statusCodes } from '../utils/exceptions';
import { logger } from '../lib/logger';
import { levelFromXp } from '../game/progression';
import { mustVerifyEmail } from '../middlewares/requireVerified';
import { TERMS_VERSION } from '../validators/auth';

/** Stored with every account: when the privacy notice was accepted, and which version. */
export const consentRecord = () => ({ termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION });

const DEFAULT_THEME_NAME = 'Agent Mint';

export const BCRYPT_ROUNDS = 12;


export type PublicUser = {
  id: number;
  username: string;
  email: string;
  mmr: number;
  money: number;
  xp: number;
  level: number;
  emailVerified: boolean;
  /** True while ranked, shop, messages and guilds stay locked until the e-mail is verified. */
  verificationRequired: boolean;
  guest: boolean;
};

export const toPublicUser = (u: Users): PublicUser => ({
  id: u.ID_User,
  username: u.Username,
  email: u.Email,
  mmr: u.MMR,
  money: u.Money,
  xp: u.XP,
  level: levelFromXp(u.XP),
  emailVerified: u.emailVerified,
  verificationRequired: mustVerifyEmail(u),
  guest: u.isGuest,
});

export const signupUser = async (input: { username: string; email: string; passwordCrea: string }) => {
  const existing = await prisma.users.findFirst({
    where: { OR: [{ Email: input.email }, { Username: input.username }] },
  });
  if (existing) {
    throw new HttpException('Utilisateur déjà existant !', ErrCodes.USER_ALREADY_EXISTS, statusCodes.BAD_REQUEST, null);
  }

  const user = await prisma.users.create({
    data: {
      Username: input.username,
      Email: input.email,
      Password: await hash(input.passwordCrea, BCRYPT_ROUNDS),
      isGuest: false,
      ...consentRecord(),
    },
  });

  // Grant the free default UI theme so the user always has a theme equipped.
  await grantDefaultTheme(user.ID_User);

  return toPublicUser(user);
};

/** Idempotent: gives the user the default UI theme and equips it if nothing is. */
const grantDefaultTheme = async (userId: number) => {
  const defaultTheme = await prisma.cosmeticItem.findUnique({ where: { name: DEFAULT_THEME_NAME } });
  if (!defaultTheme) {
    logger.warn({ userId }, 'default UI theme not seeded — run `npm run seed`');
    return;
  }
  await prisma.userCosmetic.upsert({
    where: { userId_itemId: { userId, itemId: defaultTheme.id } },
    update: {},
    create: { userId, itemId: defaultTheme.id, pricePaid: 0 },
  });
  await prisma.equippedCosmetic.upsert({
    where: { userId_type: { userId, type: 'ui_theme' } },
    update: {},
    create: { userId, type: 'ui_theme', itemId: defaultTheme.id },
  });
};

export const loginUser = async (input: { identifier: string; password: string }) => {
  const isEmail = input.identifier.includes('@');
  const user = await prisma.users.findFirst({
    // E-mails are stored lower-cased at signup.
    where: isEmail ? { Email: input.identifier.toLowerCase() } : { Username: input.identifier },
  });

  if (!user || user.archived) {
    throw new HttpException('Identifiants invalides.', ErrCodes.USER_NOT_FOUND, statusCodes.UNAUTHORIZED, null);
  }

  if (!(await compare(input.password, user.Password))) {
    throw new HttpException('Identifiants invalides.', ErrCodes.INCORRECT_PASSWORD, statusCodes.UNAUTHORIZED, null);
  }

  if (user.banned) {
    throw new HttpException('Ce compte est suspendu.', ErrCodes.ACCOUNT_LOCKED, statusCodes.FORBIDDEN, null);
  }

  await upsertSession(user.ID_User);
  await ensureRole(user.ID_User);

  return { user: toPublicUser(user), ...(await issueSession(user)) };
};

export const createGuestUser = async () => {
  const username = await generateGuestUsername();
  // Guests never log in with a password: store an unusable value instead of paying for a hash.
  const tempPassword = `!guest:${randomBytes(24).toString('hex')}`;

  const guest = await prisma.users.create({
    data: {
      Username: username,
      Email: `${username}@killspy.local`,
      Password: tempPassword,
      isGuest: true,
      ...consentRecord(),
    },
  });

  await prisma.session.create({
    data: { ID_User: guest.ID_User, Connected: true, LastConnection: new Date(), TotalLoginCount: 1 },
  });

  return { user: toPublicUser(guest), ...(await issueSession(guest)) };
};

export const logoutUser = async (userId: number) => {
  const user = await prisma.users.findUnique({ where: { ID_User: userId } });
  if (!user) {
    throw new HttpException('Utilisateur introuvable.', ErrCodes.USER_NOT_FOUND, statusCodes.NOT_FOUND, null);
  }

  if (user.isGuest) {
    await prisma.session.deleteMany({ where: { ID_User: userId } });
    await prisma.users.delete({ where: { ID_User: userId } });
    return { message: 'Utilisateur invité supprimé.' };
  }

  await prisma.session.updateMany({
    where: { ID_User: userId, Connected: true },
    data: { Connected: false, LastConnection: new Date() },
  });
  // Revoke the token that was just used (and any other one of this account).
  await prisma.users.update({ where: { ID_User: userId }, data: { tokenVersion: { increment: 1 } } });
  await revokeAllSessions(userId);

  return { message: 'Déconnexion réussie.' };
};

const upsertSession = async (userId: number) => {
  const existing = await prisma.session.findFirst({ where: { ID_User: userId } });
  if (existing) {
    await prisma.session.update({
      where: { ID_Session: existing.ID_Session },
      data: { Connected: true, LastConnection: new Date(), TotalLoginCount: existing.TotalLoginCount + 1 },
    });
  } else {
    await prisma.session.create({
      data: { ID_User: userId, Connected: true, LastConnection: new Date(), TotalLoginCount: 1 },
    });
  }
};

const ensureRole = async (userId: number) => {
  const existing = await prisma.roles.findFirst({ where: { ID_User: userId } });
  if (!existing) {
    await prisma.roles.create({ data: { ID_User: userId, Role: 'player' } });
  }
};

const generateGuestUsername = async (): Promise<string> => {
  for (let i = 0; i < 10; i++) {
    const candidate = `Guest${Math.floor(Math.random() * 1_000_000)}`;
    const exists = await prisma.users.findUnique({ where: { Username: candidate } });
    if (!exists) return candidate;
  }
  throw new HttpException('Impossible de générer un pseudo invité.', ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, null);
};
