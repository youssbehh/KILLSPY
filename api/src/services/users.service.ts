import { prisma } from '../lib/prisma';
import { HttpException, ErrCodes, statusCodes } from '../utils/exceptions';

export const updateUsername = async (userId: number, isGuest: boolean, newUsername: string) => {
  if (isGuest) {
    throw new HttpException(
      "Les utilisateurs invités ne peuvent pas changer leur nom d'utilisateur.",
      ErrCodes.IS_GUEST,
      statusCodes.FORBIDDEN,
      null,
    );
  }

  const taken = await prisma.users.findUnique({ where: { Username: newUsername } });
  if (taken) {
    throw new HttpException("Nom d'utilisateur déjà pris.", ErrCodes.USER_ALREADY_EXISTS, statusCodes.BAD_REQUEST, null);
  }

  const updated = await prisma.users.update({
    where: { ID_User: userId },
    data: { Username: newUsername },
  });

  return { id: updated.ID_User, username: updated.Username };
};

export const requestUserDeletion = async (requesterId: number, targetId: number) => {
  if (requesterId !== targetId) {
    throw new HttpException(
      'Vous ne pouvez supprimer que votre propre compte.',
      ErrCodes.UNAUTHORIZED_ACCESS,
      statusCodes.FORBIDDEN,
      null,
    );
  }

  await prisma.users.update({
    where: { ID_User: targetId },
    data: { archived: true, deletionDate: new Date() },
  });
};
