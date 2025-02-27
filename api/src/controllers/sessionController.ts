import { NextFunction, Request, Response } from 'express'
import { prisma_client } from '..';
import { HttpException, statusCodes, ErrCodes } from '../utils/exceptions';

export const getSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(req)
    res.status(200).json({ msg: "getSession atteint."})
  } catch (e:any) {
    return next(new HttpException("Erreur", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}

export const setSessionDisconnected = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(req.body)
    res.status(200).json({ msg: "setSessionDisconnected atteint."})
  } catch(e:any) {
    console.log(e)
    return next(new HttpException("Erreur", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}