import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../secrets';
import { prisma } from '../lib/prisma';

export interface SocketUser {
  id: number;
  username: string;
  isGuest: boolean;
  mmr: number;
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
      select: { ID_User: true, Username: true, isGuest: true, archived: true, banned: true, tokenVersion: true, MMR: true },
    });

    if (!user || user.archived || user.banned) return next(new Error('Utilisateur invalide.'));
    if ((payload.v ?? 0) !== user.tokenVersion) return next(new Error('Session expirée.'));

    (socket.data as SocketData).user = {
      id: user.ID_User,
      username: user.Username,
      isGuest: user.isGuest,
      mmr: user.MMR,
    };

    next();
  } catch (e: any) {
    if (e instanceof jwt.TokenExpiredError) return next(new Error('Session expirée.'));
    if (e instanceof jwt.JsonWebTokenError) return next(new Error('Token invalide.'));
    next(new Error('Authentification socket échouée.'));
  }
};
