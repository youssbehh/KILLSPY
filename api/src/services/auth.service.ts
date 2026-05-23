import { hashSync, compareSync } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Users } from '@prisma/client';

import { prisma } from '../lib/prisma';
import { JWT_SECRET } from '../secrets';
import { HttpException, ErrCodes, statusCodes } from '../utils/exceptions';

const BCRYPT_ROUNDS = 12;
const TOKEN_TTL = '7d';

export type PublicUser = {
  id: number;
  username: string;
  email: string;
  mmr: number;
  guest: boolean;
};

const toPublicUser = (u: Users): PublicUser => ({
  id: u.ID_User,
  username: u.Username,
  email: u.Email,
  mmr: u.MMR,
  guest: u.isGuest,
});

const signToken = (userId: number) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });

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
      Password: hashSync(input.passwordCrea, BCRYPT_ROUNDS),
      isGuest: false,
    },
  });

  return toPublicUser(user);
};

export const loginUser = async (input: { identifier: string; password: string }) => {
  const isEmail = input.identifier.includes('@');
  const user = await prisma.users.findFirst({
    where: isEmail ? { Email: input.identifier } : { Username: input.identifier },
  });

  if (!user || user.archived) {
    throw new HttpException('Identifiants invalides.', ErrCodes.USER_NOT_FOUND, statusCodes.UNAUTHORIZED, null);
  }

  if (!compareSync(input.password, user.Password)) {
    throw new HttpException('Identifiants invalides.', ErrCodes.INCORRECT_PASSWORD, statusCodes.UNAUTHORIZED, null);
  }

  await upsertSession(user.ID_User);
  await ensureRole(user.ID_User);

  return { user: toPublicUser(user), token: signToken(user.ID_User) };
};

export const createGuestUser = async () => {
  const username = await generateGuestUsername();
  const tempPassword = hashSync(`${username}-${Date.now()}-${Math.random()}`, BCRYPT_ROUNDS);

  const guest = await prisma.users.create({
    data: {
      Username: username,
      Email: `${username}@killspy.local`,
      Password: tempPassword,
      isGuest: true,
    },
  });

  await prisma.session.create({
    data: { ID_User: guest.ID_User, Connected: true, LastConnection: new Date(), TotalLoginCount: 1 },
  });

  return { user: toPublicUser(guest), token: signToken(guest.ID_User) };
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
