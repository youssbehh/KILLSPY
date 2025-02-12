import { NextFunction, Request, Response } from 'express'
import { prisma_client } from '..';
import { HttpException, statusCodes, ErrCodes } from '../utils/exceptions';

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(req)
    res.status(200).json({ msg: "getSettings atteint."})
  } catch (e:any) {
    return next(new HttpException("Erreur durant l'ajout d'un remboursement", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}

export const setSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(req.body)
    res.status(200).json({ msg: "setSettings atteint."})
  } catch(e:any) {
    console.log(e)
    return next(new HttpException("Erreur dans la récupération des remboursements.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}