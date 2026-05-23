import { NextFunction, Request, Response } from 'express';
import { HttpException, statusCodes, ErrCodes } from '../utils/exceptions';
import * as gamesService from '../services/games.service';

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(50, parseInt((req.query.limit as string) ?? '10', 10) || 10);
    const leaderboard = await gamesService.getLeaderboardTop(limit);
    res.status(200).json({ msg: 'Classement récupéré avec succès.', leaderboard });
  } catch (e: any) {
    return next(new HttpException("Erreur lors de la récupération du classement.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null));
  }
};
