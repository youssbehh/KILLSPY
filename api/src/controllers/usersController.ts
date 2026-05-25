import { NextFunction, Request, Response } from 'express';
import * as usersService from '../services/users.service';
import { prisma } from '../lib/prisma';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const u = await prisma.users.findUnique({ where: { ID_User: req.user!.ID_User } });
    if (!u) { res.status(404).json({ message: 'User not found' }); return; }
    res.status(200).json({
      id: u.ID_User,
      username: u.Username,
      email: u.Email,
      mmr: u.MMR,
      money: u.Money,
      guest: u.isGuest,
    });
  } catch (e) {
    next(e);
  }
};

export const updateUsername = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await usersService.updateUsername(
      req.user!.ID_User,
      req.user!.isGuest,
      req.body.newUsername,
    );
    res.status(200).json({ msg: "Nom d'utilisateur mis à jour avec succès.", user });
  } catch (e) {
    next(e);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    await usersService.requestUserDeletion(req.user!.ID_User, targetId);
    res.status(200).json({
      msg: 'Demande de suppression de compte enregistrée. Votre compte sera supprimé dans 30 jours.',
    });
  } catch (e) {
    next(e);
  }
};
