import { createHash, randomInt } from 'crypto';
import { compare, hash } from 'bcrypt';
import { AccountTokenType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendMail } from '../lib/mailer';
import { logger } from '../lib/logger';
import { HttpException, ErrCodes, statusCodes } from '../utils/exceptions';
import { BCRYPT_ROUNDS, signToken, toPublicUser } from './auth.service';

/** One-time codes are short enough to be typed on a phone. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
const CODE_LENGTH = 8;
const CODE_TTL_MS: Record<AccountTokenType, number> = {
  password_reset: 30 * 60 * 1000,
  email_verify: 24 * 60 * 60 * 1000,
};
const MAX_ATTEMPTS = 5;

const hashCode = (code: string) => createHash('sha256').update(code.toUpperCase()).digest('hex');

const generateCode = (): string =>
  Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');

const bad = (message: string) =>
  new HttpException(message, ErrCodes.BAD_REQUEST, statusCodes.BAD_REQUEST, null);

/** Replaces any previous code of the same type and returns the new clear-text code. */
const issueCode = async (userId: number, type: AccountTokenType): Promise<string> => {
  const code = generateCode();
  await prisma.$transaction([
    prisma.accountToken.deleteMany({ where: { userId, type } }),
    prisma.accountToken.create({
      data: { userId, type, codeHash: hashCode(code), expiresAt: new Date(Date.now() + CODE_TTL_MS[type]) },
    }),
  ]);
  return code;
};

/**
 * Checks a code and burns it. A wrong guess counts against the code, so a code
 * cannot be brute-forced even without the HTTP rate limit.
 */
const consumeCode = async (userId: number, type: AccountTokenType, code: string): Promise<void> => {
  const token = await prisma.accountToken.findFirst({
    where: { userId, type, usedAt: null },
    orderBy: { id: 'desc' },
  });
  const invalid = bad('Code invalide ou expiré.');
  if (!token || token.expiresAt < new Date() || token.attempts >= MAX_ATTEMPTS) throw invalid;

  if (token.codeHash !== hashCode(code)) {
    await prisma.accountToken.update({ where: { id: token.id }, data: { attempts: { increment: 1 } } });
    throw invalid;
  }

  const burned = await prisma.accountToken.updateMany({
    where: { id: token.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (burned.count !== 1) throw invalid;
};

// ── Password reset ──────────────────────────────────────────────────────────

/** Always resolves the same way: the caller must not learn whether the e-mail exists. */
export const requestPasswordReset = async (email: string): Promise<void> => {
  const user = await prisma.users.findUnique({ where: { Email: email } });
  if (!user || user.isGuest || user.archived || user.banned) return;

  const code = await issueCode(user.ID_User, 'password_reset');
  try {
    await sendMail(
      user.Email,
      'KILLSPY — réinitialisation du mot de passe',
      `Agent ${user.Username},\n\nVoici ton code de réinitialisation : ${code}\n\nIl est valable 30 minutes. Si tu n'es pas à l'origine de cette demande, ignore ce message.`,
    );
  } catch (err) {
    logger.error({ err, userId: user.ID_User }, 'password reset mail failed');
  }
};

export const resetPassword = async (email: string, code: string, newPassword: string): Promise<void> => {
  const user = await prisma.users.findUnique({ where: { Email: email } });
  if (!user || user.isGuest || user.archived) throw bad('Code invalide ou expiré.');

  await consumeCode(user.ID_User, 'password_reset', code);
  await prisma.users.update({
    where: { ID_User: user.ID_User },
    data: {
      Password: await hash(newPassword, BCRYPT_ROUNDS),
      // Every session opened with the old password is closed.
      tokenVersion: { increment: 1 },
      // Receiving the code proves the address is reachable.
      emailVerified: true,
    },
  });
};

export const changePassword = async (userId: number, currentPassword: string, newPassword: string) => {
  const user = await prisma.users.findUnique({ where: { ID_User: userId } });
  if (!user || user.isGuest) {
    throw new HttpException('Action réservée aux comptes.', ErrCodes.IS_GUEST, statusCodes.FORBIDDEN, null);
  }
  if (!(await compare(currentPassword, user.Password))) {
    throw new HttpException('Mot de passe actuel incorrect.', ErrCodes.INCORRECT_PASSWORD, statusCodes.BAD_REQUEST, null);
  }

  const updated = await prisma.users.update({
    where: { ID_User: userId },
    data: { Password: await hash(newPassword, BCRYPT_ROUNDS), tokenVersion: { increment: 1 } },
  });
  // The caller keeps its session: it gets a token signed with the new version.
  return { token: signToken(updated.ID_User, updated.tokenVersion) };
};

// ── E-mail verification ─────────────────────────────────────────────────────

export const sendVerificationEmail = async (userId: number): Promise<void> => {
  const user = await prisma.users.findUnique({ where: { ID_User: userId } });
  if (!user || user.isGuest) {
    throw new HttpException('Action réservée aux comptes.', ErrCodes.IS_GUEST, statusCodes.FORBIDDEN, null);
  }
  if (user.emailVerified) throw bad('Adresse déjà vérifiée.');

  const code = await issueCode(userId, 'email_verify');
  await sendMail(
    user.Email,
    'KILLSPY — vérification de ton adresse',
    `Agent ${user.Username},\n\nVoici ton code de vérification : ${code}\n\nIl est valable 24 heures.`,
  );
};

export const verifyEmail = async (userId: number, code: string): Promise<void> => {
  await consumeCode(userId, 'email_verify', code);
  await prisma.users.update({ where: { ID_User: userId }, data: { emailVerified: true } });
};

// ── Guest → account ─────────────────────────────────────────────────────────

/** Turns the current guest into a real account, keeping its id (and so its friends, history…). */
export const upgradeGuest = async (
  userId: number,
  input: { username: string; email: string; passwordCrea: string },
) => {
  const user = await prisma.users.findUnique({ where: { ID_User: userId } });
  if (!user) throw new HttpException('Utilisateur introuvable.', ErrCodes.USER_NOT_FOUND, statusCodes.NOT_FOUND, null);
  if (!user.isGuest) throw bad('Ce compte est déjà enregistré.');

  const taken = await prisma.users.findFirst({
    where: {
      OR: [{ Email: input.email }, { Username: input.username }],
      NOT: { ID_User: userId },
    },
  });
  if (taken) {
    throw new HttpException("Pseudo ou e-mail déjà utilisé.", ErrCodes.USER_ALREADY_EXISTS, statusCodes.BAD_REQUEST, null);
  }

  const updated = await prisma.users.update({
    where: { ID_User: userId },
    data: {
      Username: input.username,
      Email: input.email,
      Password: await hash(input.passwordCrea, BCRYPT_ROUNDS),
      isGuest: false,
      tokenVersion: { increment: 1 },
    },
  });

  const role = await prisma.roles.findFirst({ where: { ID_User: userId } });
  if (!role) await prisma.roles.create({ data: { ID_User: userId, Role: 'player' } });

  return { user: toPublicUser(updated), token: signToken(updated.ID_User, updated.tokenVersion) };
};
