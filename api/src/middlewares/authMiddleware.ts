import { Request, Response, NextFunction } from 'express'
import { HttpException, ErrCodes, statusCodes } from '../utils/exceptions'
import * as jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../secrets'
import { prisma } from '../lib/prisma'

// Roles :
// 1 = USER
// 0 = ADMIN
// -1 = BANN

const authMiddleware = (role?: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const token = req.headers.authorization
        if (!token) {
            return next(new HttpException("Token requis.", ErrCodes.TOKEN_INVALID, statusCodes.UNAUTHORIZED, null))
        }

        try {
            const payload = jwt.verify(token, JWT_SECRET) as { id: number }
            const user = await prisma.users.findUnique({ where: { ID_User: payload.id } })
            if (!user) {
                return next(new HttpException("Non autorisé!", ErrCodes.UNAUTHORIZED_ACCESS, statusCodes.UNAUTHORIZED, null))
            }

            req.user = user
            return next()
        } catch (e:any) {
            if (e instanceof jwt.TokenExpiredError) {
                return next(new HttpException("Session expirée.", ErrCodes.SESSION_EXPIRED, statusCodes.UNAUTHORIZED, null))
            }
            if (e instanceof jwt.JsonWebTokenError) {
                return next(new HttpException("Token invalide.", ErrCodes.TOKEN_INVALID, statusCodes.UNAUTHORIZED, null))
            }
            return next(new HttpException("Erreur dans la vérification d'authentification.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
        }
    }
}

export default authMiddleware