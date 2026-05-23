import { NextFunction, Request, Response } from 'express';
import * as usersService from '../services/users.service';

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
