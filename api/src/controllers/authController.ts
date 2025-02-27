import { NextFunction, Request, Response } from 'express'
import { prisma_client } from '..';
import { hashSync, compareSync } from 'bcrypt';
import * as jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../secrets';
import { HttpException, statusCodes, ErrCodes } from '../utils/exceptions';

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, passwordCrea } = req.body;
    let user = await prisma_client.users.findFirst({ where: { Email: email } });
    if (user) {
      return next(new HttpException("Utilisateur déjà existant!", ErrCodes.USER_ALREADY_EXISTS, statusCodes.UNAUTHORIZED, null))
    }

    user = await prisma_client.users.create({
      data: {
        Username: username,
        Email: email,
        Password: hashSync(passwordCrea, 12),
        MMR: 0,
        isGuest: false,
        CreatedAt: new Date()
      }
    })

    res.status(200).json({ user : {
      id : user.ID_User,
      username: user.Username,
      email: user.Email,
      password: user.Password,
      mmr : user.MMR,
    }})
  } catch (e:any) {
    return next(new HttpException("Erreur durant l'inscription", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, password } = req.body;

    // Validation de l'identifiant
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(identifier);
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    const isUsername = usernameRegex.test(identifier);
    if (!isEmail && !isUsername) {
      return next(new HttpException("Identifiant invalide!", ErrCodes.INVALID_IDENTIFIER, statusCodes.BAD_REQUEST, null));
    }

    // Recherche de l'utilisateur par email ou nom d'utilisateur
    let user = await prisma_client.users.findFirst({ 
      where: { 
        OR: [
          { Email: isEmail ? identifier : undefined },
          { Username: isUsername ? identifier : undefined }
        ]
      } 
    });
    
    if (!user) {
      return next(new HttpException("Utilisateur introuvable !", ErrCodes.USER_NOT_FOUND, statusCodes.NOT_FOUND, null));
    }

    const comparePassword = compareSync(password, user.Password);

    if(!comparePassword){
      return next(new HttpException("Mot de passe incorrect !", ErrCodes.INCORRECT_PASSWORD, statusCodes.BAD_REQUEST, null));
    }

    if (user?.archived){
      return next(new HttpException("Utilisateur Supprimé !", ErrCodes.USER_NOT_FOUND, statusCodes.NOT_FOUND, null));
    }

    // Vérifie si une session existe déjà pour cet utilisateur
    const existingSession = await prisma_client.session.findFirst({
      where: { ID_User: user.ID_User }
    });

    if (existingSession) {
      // 🔥 Mettre à jour la session existante
      await prisma_client.session.update({
        where: { ID_Session: existingSession.ID_Session },
        data: { Connected: true, LastConnection: new Date(), TotalLoginCount: existingSession.TotalLoginCount + 1 }
      });
    } else {
      // 🔥 Créer une nouvelle session si elle n'existe pas
      await prisma_client.session.create({
        data: { ID_User: user.ID_User, Connected: true, LastConnection: new Date(), TotalLoginCount: +1 }
      });
    }

    const existingRole = await prisma_client.roles.findFirst({
      where: { ID_User: user.ID_User }
    });

    if (existingRole) {
      await prisma_client.roles.create({
        data: { ID_User: user.ID_User, Role: 'player' }
      });
    }

    const existingLeaderboard = await prisma_client.leaderboard.findFirst({
      where: { ID_User: user.ID_User }
    });

    if (existingLeaderboard) {
      await prisma_client.leaderboard.create({
        data: { ID_User: user.ID_User }
      });
    }

    const token = jwt.sign({
      id : user.ID_User,
    },JWT_SECRET)

    res.json({  user : {
        id : user.ID_User,
        username: user.Username,
        email: user.Email,
        mmr : user.MMR,
        guest : user.isGuest
      }, 
      token
    })
  } catch (e:any) {

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
        isGuest: true,
        CreatedAt: new Date(),
        archived: false,
        deletionDate: null
      }
    })

    // 🔥 Crée une session pour l'invité avec `Connected = true`
    await prisma_client.session.create({
      data: {
        ID_User: guest.ID_User,
        Connected: true,
        LastConnection: new Date(),
        TotalLoginCount: +1
      }
    });

    const token = jwt.sign({
      id : guest.ID_User,
    },JWT_SECRET)

    res.json({ user : {
      id : guest.ID_User,
      username: guest.Username,
      mmr : guest.MMR,
      guest : guest.isGuest
    },
    token
    })
  } catch (e:any) {
    return next(new HttpException("Erreur compte invité", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (!id) {
      return next(new HttpException("Utilisateur non authentifié.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.UNAUTHORIZED, null));
    }

    const user = await prisma_client.users.findUnique({ where: { ID_User: userId } });

    const existingSession = await prisma_client.session.findFirst({
      where: { ID_User: userId }
    });

    if (!user) {
      return next(new HttpException("Utilisateur introuvable.", ErrCodes.USER_NOT_FOUND, statusCodes.NOT_FOUND, null));
    }

    if (user.isGuest) {
      try {
        await prisma_client.session.deleteMany({ where: { ID_User: userId } });
        await prisma_client.users.delete({ where: { ID_User: userId } });

        console.log(`🗑️ Utilisateur invité supprimé : ${user.Username}`);
        res.status(200).json({ message: "Utilisateur invité supprimé." });
      } catch (error) {
        console.error("Erreur lors de la suppression de l'utilisateur invité :", error);
        return next(new HttpException("Erreur lors de la suppression de l'invité.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, error));
      }
    } else {
      await prisma_client.session.update({
        where: { ID_Session: existingSession?.ID_Session },
        data: { Connected: false, LastConnection: new Date() }
      });

      res.status(200).json({ message: "Déconnexion réussie." });
    }
  } catch (error) {
    console.error("Erreur lors de la déconnexion :", error);
    return next(new HttpException("Erreur de déconnexion.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, error));
  }
};