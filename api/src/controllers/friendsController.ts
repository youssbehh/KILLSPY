import { NextFunction, Request, Response } from 'express';
import * as friendsService from '../services/friends.service';

export const addFriend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await friendsService.addFriend(req.user!.ID_User, req.body.Username);
    res.status(201).json({ message: `L'utilisateur "${result.friendUsername}" a bien été ajouté !` });
  } catch (e) {
    next(e);
  }
};

export const getFriendsByUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await friendsService.listFriends(req.user!.ID_User);
    res.status(200).json({ msg: 'Amis récupérés.', record });
  } catch (e) {
    next(e);
  }
};

export const getBlockedFriends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await friendsService.listBlockedFriends(req.user!.ID_User);
    res.status(200).json({ msg: 'Amis bloqués récupérés.', record });
  } catch (e) {
    next(e);
  }
};
