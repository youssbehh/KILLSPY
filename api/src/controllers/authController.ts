import { NextFunction, Request, Response } from 'express'
import { prisma_client } from '..';
import { hashSync, compareSync } from 'bcrypt';
import * as jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../secrets';
import { HttpException, statusCodes, ErrCodes } from '../utils/exceptions';

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;
    let user = await prisma_client.users.findFirst({ where: { Email: email } });
    if (user) {
      return next(new HttpException("Utilisateur déjà existant!", ErrCodes.USER_ALREADY_EXISTS, statusCodes.UNAUTHORIZED, null))
    }
    user = await prisma_client.users.create({
      data: {
        Username: username,
        Email: email,
        Password: hashSync(password, 10),
        MMR: 0,
      }
    })
    res.status(200).json({ user : {
      id : user.ID_User,
      username: user.Username,
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
    let user = await prisma_client.users.findFirst({ where: { Email: email } });
    if (!user) {
      return next(new HttpException("Utilisateur introuvable!", ErrCodes.USER_NOT_FOUND, statusCodes.NOT_FOUND, null));
    }
    if(!compareSync(password, user.Password)){
      return next(new HttpException("Mot de passe incorrect!", ErrCodes.INCORRECT_PASSWORD, statusCodes.BAD_REQUEST, null));
    }
    const token = jwt.sign({
      id : user.ID_User,
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

const generateGuestUsername = async () => {
  while (true) {
    const randomNum = Math.floor(Math.random() * 100000);
    const guestUsername = `Guest${randomNum}`;
    const existingUser = await prisma_client.users.findFirst({ 
      where: { Username: guestUsername } 
    });
    if (!existingUser) return guestUsername;
  }
};

export const guest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = await generateGuestUsername();
    const guest = await prisma_client.users.create({
      data: {
        Username: username,
        Email: username+"@killspy.com",
        Password: hashSync("guest", 10),
        MMR: 0,
      }
    })
    res.status(200).json({ user : {
      id : guest.ID_User,
      username: guest.Username,
      mmr : guest.MMR,
    }})
  } catch (e:any) {
    return next(new HttpException("Erreur compte invité", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}