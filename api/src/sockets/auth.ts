import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../secrets';
import { prisma } from '../lib/prisma';
import { CombatFxNames } from './events';

export interface SocketUser {
  id: number;
  username: string;
  isGuest: boolean;
  emailVerified: boolean;
  mmr: number;
  /** Equipped combat effects, read when the connection opens. */
  fx: CombatFxNames;
}

export interface SocketData {
  user?: SocketUser;
}

export const socketAuth = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = (socket.handshake.auth?.token as string | undefined)
      ?? (socket.handshake.headers.authorization as string | undefined);

    if (!token) return next(new Error('Token requis.'));

    const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
    const payload = jwt.verify(raw, JWT_SECRET) as { id: number; v?: number };
    const user = await prisma.users.findUnique({
      where: { ID_User: payload.id },
      select: {
        ID_User: true, Username: true, isGuest: true, emailVerified: true, archived: true, banned: true, tokenVersion: true, MMR: true,
        Equipped: { where: { type: { in: ['shoot_anim', 'shield_anim'] } }, select: { type: true, item: { select: { name: true } } } },
      },
    });

    if (!user || user.archived || user.banned) return next(new Error('Utilisateur invalide.'));
    if ((payload.v ?? 0) !== user.tokenVersion) return next(new Error('Session expirée.'));

    (socket.data as SocketData).user = {
      id: user.ID_User,
      username: user.Username,
      isGuest: user.isGuest,
      emailVerified: user.emailVerified,
      mmr: user.MMR,
      fx: {
        shoot: user.Equipped.find((e) => e.type === 'shoot_anim')?.item.name ?? null,
        shield: user.Equipped.find((e) => e.type === 'shield_anim')?.item.name ?? null,
      },
    };

    next();
  } catch (e: any) {
    if (e instanceof jwt.TokenExpiredError) return next(new Error('Session expirée.'));
    if (e instanceof jwt.JsonWebTokenError) return next(new Error('Token invalide.'));
    next(new Error('Authentification socket échouée.'));
  }
};
