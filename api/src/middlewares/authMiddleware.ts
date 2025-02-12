import { Request, Response, NextFunction } from 'express'
import { HttpException, ErrCodes, statusCodes } from '../utils/exceptions'
import * as jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../secrets'
import { prisma_client } from '..'

// Roles :
// 1 = USER
// 0 = ADMIN
// -1 = BANN

const authMiddleware = (role?: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const token = req.headers.authorization
        if (!token) {
            return next(new HttpException("Token indisponible", ErrCodes.TOKEN_INVALID, statusCodes.BAD_REQUEST, null))
        }

        try {
            const payload = jwt.verify(token, JWT_SECRET) as any;
            const user = await prisma_client.users.findFirst({ where: { id: payload.userId } })
            if (!user) {
                return next(new HttpException("Non autorisé!", ErrCodes.UNAUTHORIZED_ACCESS, statusCodes.BAD_REQUEST, null))
            }

            if (payload.role != role) return next(new HttpException("Droit requis!", ErrCodes.UNAUTHORIZED_ACCESS, statusCodes.UNAUTHORIZED, null))

            req.user = user
            return next()
        } catch (e:any) {
            console.log(e.message)
            return next(new HttpException("Erreur dans la vérification d'authentification.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
        }
    }
}

export default authMiddleware