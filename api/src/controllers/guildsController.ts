import { NextFunction, Request, Response } from 'express';
import * as guildsService from '../services/guilds.service';

export const listGuilds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guilds = await guildsService.listGuilds(req.query.search as string | undefined);
    res.json({ guilds, createCost: guildsService.GUILD_CREATE_COST });
  } catch (e) { next(e); }
};

export const getMyGuild = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guild = await guildsService.getUserGuild(req.user!.ID_User);
    res.json({ guild });
  } catch (e) { next(e); }
};

export const createGuild = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, tag, description } = req.body;
    if (!name || !tag) { res.status(400).json({ message: 'name et tag requis.' }); return; }
    const guild = await guildsService.createGuild(req.user!.ID_User, name, tag, description);
    res.status(201).json({ guild });
  } catch (e) { next(e); }
};

export const joinGuild = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const guild = await guildsService.joinGuild(req.user!.ID_User, id);
    res.json({ guild });
  } catch (e) { next(e); }
};

export const leaveGuild = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await guildsService.leaveGuild(req.user!.ID_User);
    res.json({ message: 'Vous avez quitté la guilde.' });
  } catch (e) { next(e); }
};

export const kickMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = parseInt(req.params.userId, 10);
    await guildsService.kickMember(req.user!.ID_User, targetId);
    res.json({ message: 'Membre expulsé.' });
  } catch (e) { next(e); }
};
