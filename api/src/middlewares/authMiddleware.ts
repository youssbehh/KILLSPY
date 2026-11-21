import { Request, Response, NextFunction } from 'express'
import { HttpException, ErrCodes, statusCodes } from '../utils/exceptions'
import * as jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../secrets'
import { prisma } from '../lib/prisma'

export type RequiredRole = 'admin';

/**
 * Authenticates the request from its JWT.
 * - rejects archived and banned accounts, and tokens revoked by a tokenVersion bump;
 * - with `role`, also requires that role in the Roles table.
 */
const authMiddleware = (role?: RequiredRole) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const header = req.headers.authorization
        const token = header?.startsWith('Bearer ') ? header.slice(7) : header
        if (!token) {
            return next(new HttpException("Token requis.", ErrCodes.TOKEN_INVALID, statusCodes.UNAUTHORIZED, null))
        }

        try {
            const payload = jwt.verify(token, JWT_SECRET) as { id: number; v?: number }
            const user = await prisma.users.findUnique({ where: { ID_User: payload.id } })
            if (!user || user.archived) {
                return next(new HttpException("Non autorisé!", ErrCodes.UNAUTHORIZED_ACCESS, statusCodes.UNAUTHORIZED, null))
            }
            // Tokens issued before versioning carry no `v` and count as version 0.
            if ((payload.v ?? 0) !== user.tokenVersion) {
                return next(new HttpException("Session expirée.", ErrCodes.SESSION_EXPIRED, statusCodes.UNAUTHORIZED, null))
            }
            if (user.banned) {
                return next(new HttpException("Ce compte est suspendu.", ErrCodes.ACCOUNT_LOCKED, statusCodes.UNAUTHORIZED, null))
            }

            if (role) {
                const granted = await prisma.roles.findFirst({ where: { ID_User: user.ID_User, Role: role } })
                if (!granted) {
                    return next(new HttpException("Accès interdit.", ErrCodes.UNAUTHORIZED_ACCESS, statusCodes.FORBIDDEN, null))
                }
            }

            req.user = user
            return next()
        } catch (e: unknown) {
            if (e instanceof jwt.TokenExpiredError) {
                return next(new HttpException("Session expirée.", ErrCodes.SESSION_EXPIRED, statusCodes.UNAUTHORIZED, null))
            }
            if (e instanceof jwt.JsonWebTokenError) {
                return next(new HttpException("Token invalide.", ErrCodes.TOKEN_INVALID, statusCodes.UNAUTHORIZED, null))
            }
            return next(new HttpException("Erreur dans la vérification d'authentification.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, null))
        }
    }
}

export default authMiddleware
