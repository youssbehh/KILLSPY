import { NextFunction, Request, Response } from 'express';
import * as missionsService from '../services/missions.service';

export const getDailyMissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const missions = await missionsService.getDailyMissions(req.user!.ID_User);
    res.status(200).json({ missions });
  } catch (e) {
    next(e);
  }
};

export const claimDailyMission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid mission id' }); return; }
    const result = await missionsService.claimMission(req.user!.ID_User, id);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
