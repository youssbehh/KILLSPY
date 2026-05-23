import { NextFunction, Request, Response } from 'express'
import { HttpException, statusCodes, ErrCodes } from '../utils/exceptions';

export const getPing = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(200).json({ msg: "Serveur opérationnel" })
    } catch (e: any) {
        return next(new HttpException("Erreur", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
    }
}