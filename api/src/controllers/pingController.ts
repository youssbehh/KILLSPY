import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { HttpException, statusCodes, ErrCodes } from '../utils/exceptions';

/**
 * Liveness + readiness probe.
 * Returns 200 only if the API can reach its database.
 * Otherwise 503 so the client can show the right "offline" message.
 */
export const getPing = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ msg: 'Serveur opérationnel', db: true });
  } catch (e) {
    return next(
      new HttpException(
        'Service temporairement indisponible.',
        ErrCodes.DATABASE_ERROR,
        statusCodes.SERVICE_UNAVAILABLE,
        null,
      ),
    );
  }
};
