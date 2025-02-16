import { NextFunction, Request, Response } from 'express'
import { prisma_client } from '..';
import { HttpException, statusCodes, ErrCodes } from '../utils/exceptions';
import { toISODateTime } from '../utils/NL_UTILS';

export const addFriend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { Username } = req.body
    const ID_User = req.user.id;

    const user = await prisma_client.users.findFirst({ 
      where : { 
        AND: [
          { ID_User },
          { Username }
      ]}
    })
    if(!user) return next(new HttpException("Utilisateur introuvable!", ErrCodes.CLIENT_NOT_FOUND, statusCodes.NOT_FOUND, null));

    const record = await prisma_client.friends.create({
      data: {
        ID_Friend,
        userId : user.ID_User
      }
    })    
    res.status(200).json({ message : "L'utilisateur \"" + Username + "\" à bien été ajoutée!" })
  } catch (e:any) {
    return next(new HttpException("Erreur durant l'ajout d'un prêt", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}

export const getFriendsByUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await prisma_client.friends.findMany({ where : { userId: req.user.id }, include: { User: true }})
    if(!record) return next(new HttpException("Aucun prêt.", ErrCodes.LOAN_NOT_FOUND, statusCodes.NOT_FOUND, null))
    res.status(200).json({ msg: "Prêts bien trouvés.", record })
  } catch(e:any) {
    console.log(e)
    return next(new HttpException("Erreur dans la récupération du client.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}

export const getBlockedFriends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tagClient } = req.params
    if(!tagClient) return next(new HttpException("Aucun client fournit.", ErrCodes.BAD_REQUEST, statusCodes.BAD_REQUEST, null))
    const record = await prisma_client.friends.findMany({
      where: {
        userId: req.user.id,
        client: {
          clientTag: tagClient,
        },
      },
      include: {
        client: true,
      },
    });
    if(!record) return next(new HttpException("Aucun prêt.", ErrCodes.LOAN_NOT_FOUND, statusCodes.NOT_FOUND, null))
    res.status(200).json({ msg: "Prêts concernant "+ tagClient +" bien trouvé.", record })
  } catch(e:any) {
    console.log(e)
    return next(new HttpException("Erreur dans la récupération du client.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}