import { NextFunction, Request, Response } from 'express'
import { prisma_client } from '..';
import { HttpException, statusCodes, ErrCodes } from '../utils/exceptions';
import { toISODateTime } from '../utils/NL_UTILS';

export const addInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { } = req.body
    const userId = req.user.id;

    const client = await prisma_client.users.findFirst({ where : { ID_User: userId }})
    if(!client) return next(new HttpException("Utilisateur introuvable!", ErrCodes.USER_NOT_FOUND, statusCodes.NOT_FOUND, null));

    const record = await prisma_client.inventory.create({
      data: {
        Money: 0,
        Qty: 0,
        User: {
          connect: { ID_User: userId }
        }
      }
    })    
    res.status(200).json({ message : "Remboursement du prêt \"" + record + "\" bien créé!" })
  } catch (e:any) {
    return next(new HttpException("Erreur durant l'ajout d'un remboursement", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}

export const myInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const records = await prisma_client.inventory.findMany({
      where: {
        User: {
          ID_User: req.user.id
        }
      },
      select: {
        ID_Inventory: true,
        Money: true,
        Qty: true,
        User: {
          select: {
            ID_User: true,
          }
        }
      }
    });
    if(!records) return next(new HttpException("Aucun inventaire trouvé.", ErrCodes.UNAUTHORIZED_ACCESS, statusCodes.NOT_FOUND, null))
    res.status(200).json({ msg: "Inventaire bien trouvés.", records })
  } catch(e:any) {
    console.log(e)
    return next(new HttpException("Erreur dans la récupération de inventaire.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}