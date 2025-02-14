import { NextFunction, Request, Response } from 'express'
import { prisma_client } from '..';
import { hashSync, compareSync } from 'bcrypt';
import * as jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../secrets';
import { HttpException, statusCodes, ErrCodes } from '../utils/exceptions';

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;
    let user = await prisma_client.users.findFirst({ where: { Email } });
    if (user) {
      return next(new HttpException("Utilisateur déjà existant!", ErrCodes.USER_ALREADY_EXISTS, statusCodes.UNAUTHORIZED, null))
    }
    user = await prisma_client.users.create({
      data: {
        username,
        email,
        password: hashSync(password, 10),
      }
    })
    res.status(200).json({ user : {
      id : user.ID_User,
      Username: user.Username,
      email: user.Email,
      mmr : user.MMR,
    }})
  } catch (e:any) {
    return next(new HttpException("Erreur durant l'inscription", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    let user = await prisma_client.users.findFirst({ where: { Email } });
    if (!user) {
      return next(new HttpException("Utilisateur introuvable!", ErrCodes.USER_NOT_FOUND, statusCodes.NOT_FOUND, null));
    }
    if(!compareSync(password, user.Password)){
      return next(new HttpException("Mot de passe incorrect!", ErrCodes.INCORRECT_PASSWORD, statusCodes.BAD_REQUEST, null));
    }
    const token = jwt.sign({
      userId : user.ID_User,
    },JWT_SECRET)
    res.json({  user : {
        id : user.ID_User,
        username: user.Username,
        email: user.Email,
        mmr : user.MMR,
      }, 
      token
    })
  } catch (e:any) {
    console.log(e)
    return next(new HttpException("Erreur durant la connexion.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}

export const guest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.body;
    let guest = await prisma_client.users.findFirst({ where: { Username } });
    if (guest) {
      return next(new HttpException("Pseudo d'invité déjà existant!", ErrCodes.USER_ALREADY_EXISTS, statusCodes.UNAUTHORIZED, null))
    }
    guest = await prisma_client.users.create({
      data: {
        username,
      }
    })
    res.status(200).json({ user : {
      id : guest.ID_User,
      Username: guest.Username,
      mmr : guest.MMR,
    }})
  } catch (e:any) {
    return next(new HttpException("Erreur compte invité", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}