import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { HttpException, ErrCodes, statusCodes } from '../utils/exceptions';

type Source = 'body' | 'params' | 'query';

export const validate = (schema: ZodSchema, source: Source = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issues = (result.error as ZodError).issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(new HttpException(
        'Données invalides.',
        ErrCodes.BAD_REQUEST,
        statusCodes.BAD_REQUEST,
        issues,
      ));
    }
    req[source] = result.data;
    next();
  };
};
