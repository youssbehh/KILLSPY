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

export const updateUsername = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const { oldUser } = req.params; // Le nouveau nom d'utilisateur doit être passé dans les paramètres
      const { newUsername } = req.body; // Le nouveau nom d'utilisateur doit être passé dans le corps de la requête

      if (!oldUser || !newUsername) {
          return next(new HttpException("Nom d'utilisateur actuel et nouveau nom d'utilisateur requis.", ErrCodes.BAD_REQUEST, statusCodes.BAD_REQUEST, null));
      }

      // Vérifiez si l'utilisateur existe
      const user = await prisma_client.users.findUnique({
          where: { ID_User: req.user.id } // Assurez-vous que l'utilisateur est authentifié
      });

      if (!user) {
          return next(new HttpException("Utilisateur introuvable.", ErrCodes.UNAUTHORIZED_ACCESS, statusCodes.NOT_FOUND, null));
      }

      // Vérifiez si l'utilisateur est un invité
      if (user.isGuest) {
        return next(new HttpException("Les utilisateurs invités ne peuvent pas changer leur nom d'utilisateur.", ErrCodes.IS_GUEST, statusCodes.FORBIDDEN, null));
    }


      // Mettre à jour le nom d'utilisateur
      const updatedUser = await prisma_client.users.update({
          where: { ID_User: req.user.id },
          data: { Username: newUsername }
      });

      res.status(200).json({ msg: "Nom d'utilisateur mis à jour avec succès.", user: updatedUser });
  } catch (e: any) {
      console.log(e);
      return next(new HttpException("Erreur lors de la mise à jour du nom d'utilisateur.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null));
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
      // Vérifiez si l'utilisateur existe
      const user = await prisma_client.users.findUnique({
          where: { ID_User: req.user.id }
      });

      if (!user) {
          return next(new HttpException("Utilisateur introuvable.", ErrCodes.UNAUTHORIZED_ACCESS, statusCodes.NOT_FOUND, null));
      }

      // Marquer l'utilisateur comme supprimé
      await prisma_client.users.update({
          where: { ID_User: req.user.id },
          data: {
              archived: true,
              deletionDate: new Date() // Enregistrer la date de la demande de suppression
          }
      });

      res.status(200).json({ msg: "Demande de suppression de compte enregistrée. Votre compte sera supprimé dans 30 jours." });
  } catch (e: any) {
      console.log(e);
      return next(new HttpException("Erreur lors de la demande de suppression du compte.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null));
  }
};