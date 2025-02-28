import { NextFunction, Request, Response } from 'express'
import { prisma_client } from '..';
import { HttpException, statusCodes, ErrCodes } from '../utils/exceptions';

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leaderboard = await prisma_client.leaderboard.findMany({
      where: {
        User: {
          isGuest: false
        }
      },
      include: {
        User: {
          select: {
            Username: true,
            MMR: true,
            Rank: {
              select: {
                RankName: true
              }
            }
          }
        }
      },
      take: 5,
      orderBy: {
        User: {
          MMR: 'desc'
        }
      }
    });
    console.log(leaderboard)

    res.status(200).json({ msg: "Classement récupéré avec succès.", leaderboard });
  } catch (e: any) {
    return next(new HttpException("Erreur lors de la récupération du classement.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null));
  }
}

export const setLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;

    // Créer ou mettre à jour le classement pour l'utilisateur
    const leaderboardEntry = await prisma_client.leaderboard.upsert({
      where: { ID_User: userId },
      update: { /* Mettez à jour les champs nécessaires ici */ },
      create: {
        User: { connect: { ID_User: userId } }
      }
    });

    res.status(200).json({ msg: "setLeaderboard atteint."})
  } catch(e:any) {
    console.log(e)
    return next(new HttpException("Erreur", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}