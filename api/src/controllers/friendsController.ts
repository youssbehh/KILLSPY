import { NextFunction, Request, Response } from 'express'
import { prisma_client } from '..';
import { HttpException, statusCodes, ErrCodes } from '../utils/exceptions';
import { toISODateTime } from '../utils/NL_UTILS';

export const addFriend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { Username } = req.body
    const myUserId = req.user.id;

    // Recherche l'utilisateur à ajouter par son username
    const friendToAdd = await prisma_client.users.findFirst({ 
      where: { 
        Username: Username,
        NOT: {
          ID_User: myUserId // Exclure l'utilisateur lui-même
        }
      }
    });

    if (!friendToAdd) {
      return next(new HttpException("Utilisateur introuvable!", ErrCodes.CLIENT_NOT_FOUND, statusCodes.NOT_FOUND, null));
    }

    // Vérifie si l'amitié existe déjà
    const existingFriendship = await prisma_client.friends.findFirst({
      where: {
        AND: [
          { ID_User: myUserId },
          { ID_Friend: friendToAdd.ID_User }
        ]
      }
    });

    if (existingFriendship) {
      return next(new HttpException("Cette amitié existe déjà!", ErrCodes.FRIEND_ALREADY_EXISTS, statusCodes.BAD_REQUEST, null));
    }

    // Crée la relation d'amitié
    const friend = await prisma_client.friends.create({
      data: {
        ID_User: myUserId,
        ID_Friend: friendToAdd.ID_User,
        Connected: false,
        Blocked: false
      }
    });

    res.status(200).json({ message: `L'utilisateur "${Username}" a bien été ajouté!` });
  } catch (e:any) {
    return next(new HttpException("Erreur durant l'ajout d'un ami", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null));
  }
}

export const getFriendsByUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await prisma_client.friends.findMany({ where : { ID_User: req.user.id }, include: { User: true }})
    if(!record) return next(new HttpException("Aucun ami.", ErrCodes.FRIENDS_NOT_FOUND, statusCodes.NOT_FOUND, null))
    res.status(200).json({ msg: "Prêts bien trouvés.", record })
  } catch(e:any) {
    console.log(e)
    return next(new HttpException("Erreur dans la récupération du client.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}

export const getBlockedFriends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ID_User } = req.params
    if(!ID_User) return next(new HttpException("Aucun client fournit.", ErrCodes.BAD_REQUEST, statusCodes.BAD_REQUEST, null))
    const record = await prisma_client.friends.findMany({
      where: {
        ID_User: req.user.id,
        Blocked: true,
      },
    });
    if(!record) return next(new HttpException("Aucun ami.", ErrCodes.FRIENDS_NOT_FOUND, statusCodes.NOT_FOUND, null))
    res.status(200).json({ msg: "L'ami bloqué "+ ID_User +" bien trouvé.", record })
  } catch(e:any) {
    console.log(e)
    return next(new HttpException("Erreur dans la récupération du client.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}