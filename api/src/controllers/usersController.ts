import { NextFunction, Request, Response } from 'express'
import { prisma_client } from '..';
import { HttpException, statusCodes, ErrCodes } from '../utils/exceptions';
import { hashSync } from 'bcrypt';

export const addUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return next(new HttpException("Tous les champs sont requis.", ErrCodes.BAD_REQUEST, statusCodes.BAD_REQUEST, null));
    }

    const sanitizedUsername = (username.replace(/\s+/g, '')).toUpperCase();

    let user = await prisma_client.users.findFirst({
      where: {
        OR: [
          { Username: sanitizedUsername }
        ]
      }
    });

    if (user) {
      return next(new HttpException("Utilisateur déjà créé!", ErrCodes.USER_ALREADY_EXISTS, statusCodes.UNAUTHORIZED, null))
    }

    user = await prisma_client.users.create({
      data : { 
        ID_User: req.user.id,
        Username: sanitizedUsername,
        Email: email, 
        Password: hashSync(password, 10),
        MMR: 0
      }
    })

    res.status(200).json( { msg: "Utilisateur bien créé!" } )
  } catch(e:any) {
    console.log(e)
    return next(new HttpException("Erreur dans la création d'un utilisateur.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}

export const getUsersById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma_client.users.findMany({ where : { ID_User: req.user.id }})
    if(!users) return next(new HttpException("Aucun utilisateur trouvé.", ErrCodes.UNAUTHORIZED_ACCESS, statusCodes.NOT_FOUND, null))

    res.status(200).json({ msg: "Utilisateurs bien trouvés.", users })
  } catch(e:any) {
    console.log(e)
    return next(new HttpException("Erreur dans la récupération des utilisateurs.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}

export const getOneUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tagUser } = req.params
    if(!tagUser) return next(new HttpException("Aucun utilisateur fournit.", ErrCodes.BAD_REQUEST, statusCodes.BAD_REQUEST, null))
    const user = await prisma_client.users.findMany({ 
      where : { 
        AND :
        [
          { ID_User: req.user.id }, 
          { Username: tagUser }
        ] 
      }
    })
    if(!user) return next(new HttpException("Utilisateur introuvable.", ErrCodes.UNAUTHORIZED_ACCESS, statusCodes.NOT_FOUND, null))

    res.status(200).json({ msg: "Utilisateur bien trouvé.", user })
  } catch(e:any) {
    console.log(e)
    return next(new HttpException("Erreur dans la récupération de l'utilisateur.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}

export const getAllTAgs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await prisma_client.users.findMany({ where : { ID_User: req.user.id }, select: { Username: true }})
    if(!tags) return next(new HttpException("Aucun Username trouvé.", ErrCodes.UNAUTHORIZED_ACCESS, statusCodes.NOT_FOUND, null))

    res.status(200).json({ msg: "Usernames bien trouvés.", tags })
  } catch(e:any) {
    console.log(e)
    return next(new HttpException("Erreur dans la récupération des usernames.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}