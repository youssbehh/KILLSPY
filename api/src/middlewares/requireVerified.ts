import { Request, Response, NextFunction } from 'express';
import { HttpException, ErrCodes, statusCodes } from '../utils/exceptions';
import { isMailConfigured } from '../lib/mailer';

export const UNVERIFIED_MESSAGE = 'Vérifie ton adresse e-mail pour accéder à cette fonction.';

/**
 * Accounts whose e-mail is not verified cannot spend, chat or join a guild.
 * Guests pass through: their own restrictions are enforced by each service.
 * Without a mail server nobody could ever verify, so nothing is gated then.
 */
export const mustVerifyEmail = (user: { isGuest: boolean; emailVerified: boolean }): boolean =>
  isMailConfigured() && !user.isGuest && !user.emailVerified;

export const requireVerifiedEmail = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user && mustVerifyEmail(req.user)) {
    return next(new HttpException(UNVERIFIED_MESSAGE, ErrCodes.EMAIL_NOT_VERIFIED, statusCodes.FORBIDDEN, null));
  }
  next();
};
