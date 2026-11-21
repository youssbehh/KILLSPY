import { NextFunction, Request, Response } from 'express';
import * as gamesService from '../services/games.service';

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.max(1, Math.min(50, parseInt((req.query.limit as string) ?? '10', 10) || 10));
    const leaderboard = await gamesService.getLeaderboardTop(limit);
    res.status(200).json({ msg: 'Classement récupéré avec succès.', leaderboard });
  } catch (e) {
    next(e);
  }
};
