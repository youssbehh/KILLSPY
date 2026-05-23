import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpException, ErrCodes, statusCodes } from '../utils/exceptions';
import { logger } from '../lib/logger';
import { NODE_ENV } from '../secrets';

const isProd = NODE_ENV === 'production';

/**
 * Central error handler.
 *
 * - HttpException → relayed as-is (intentional client-facing messages).
 * - ZodError → 400 with the field paths/messages (still safe to expose).
 * - Prisma errors and any other Error → opaque 500 to the client, full detail logged server-side.
 *
 * Never leak internal hostnames, file paths, SQL, or stack traces to the client.
 */
export const errorMiddleware = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // ---- 1. Our own HttpException (controlled errors) ----------------------
  if (error instanceof HttpException) {
    res.status(error.statusCode).json({
      message: error.message,
      errorCode: error.errorCode,
      errors: error.errors ?? null,
    });
    return;
  }

  // ---- 2. Zod validation errors -----------------------------------------
  if (error instanceof ZodError) {
    res.status(statusCodes.BAD_REQUEST).json({
      message: 'Données invalides.',
      errorCode: ErrCodes.BAD_REQUEST,
      errors: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }

  // ---- 3. Prisma errors -------------------------------------------------
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    logger.error({ err: errorToLog(error), path: req.path }, 'database unavailable');
    res.status(statusCodes.SERVICE_UNAVAILABLE).json({
      message: 'Service temporairement indisponible. Réessaie dans un instant.',
      errorCode: ErrCodes.DATABASE_ERROR,
      errors: null,
    });
    return;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientValidationError
  ) {
    logger.error({ err: errorToLog(error), path: req.path }, 'database error');
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Erreur interne du serveur.',
      errorCode: ErrCodes.DATABASE_ERROR,
      errors: null,
    });
    return;
  }

  // ---- 4. Anything else (unexpected) ------------------------------------
  logger.error({ err: errorToLog(error), path: req.path }, 'unexpected error');
  res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
    message: 'Erreur interne du serveur.',
    errorCode: ErrCodes.INTERNAL_SERVER_ERROR,
    // Only expose details in non-prod to help debugging.
    errors: isProd ? null : safeDevDetails(error),
  });
};

const errorToLog = (e: unknown): Record<string, unknown> => {
  if (e instanceof Error) {
    return {
      name: e.name,
      message: e.message,
      stack: e.stack,
      ...(e as any).code ? { code: (e as any).code } : {},
    };
  }
  return { value: String(e) };
};

const safeDevDetails = (e: unknown) => {
  if (e instanceof Error) return { name: e.name, message: e.message };
  return { value: String(e) };
};
