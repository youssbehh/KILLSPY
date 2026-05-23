import { NextFunction, Request, Response } from 'express';
import * as gamesService from '../services/games.service';

export const postGameResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await gamesService.recordGame({
      userId: req.user!.ID_User,
      outcome: req.body.outcome,
      mode: req.body.mode,
    });
    res.status(201).json({ result });
  } catch (e) {
    next(e);
  }
};

export const getMyStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await gamesService.getUserStats(req.user!.ID_User);
    res.status(200).json(data);
  } catch (e) {
    next(e);
  }
};

export const getMyHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await gamesService.getUserStats(req.user!.ID_User);
    res.status(200).json({ recentGames: data.recentGames, stats: data.stats });
  } catch (e) {
    next(e);
  }
};
