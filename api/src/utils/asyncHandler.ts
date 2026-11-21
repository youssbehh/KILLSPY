import { NextFunction, Request, RequestHandler, Response } from 'express';

/** Wraps an async route so a rejected promise reaches the error middleware. */
export const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
