import { prisma } from '../lib/prisma';
import { HttpException, ErrCodes, statusCodes } from '../utils/exceptions';

export const addFriend = async (userId: number, friendUsername: string) => {
  const friendToAdd = await prisma.users.findFirst({
    where: { Username: friendUsername, NOT: { ID_User: userId } },
  });

  if (!friendToAdd) {
    throw new HttpException('Utilisateur introuvable !', ErrCodes.USER_NOT_FOUND, statusCodes.NOT_FOUND, null);
  }

  const existing = await prisma.friends.findUnique({
    where: { ID_User_ID_Friend: { ID_User: userId, ID_Friend: friendToAdd.ID_User } },
  });

  if (existing) {
    throw new HttpException('Cette amitié existe déjà !', ErrCodes.FRIEND_ALREADY_EXISTS, statusCodes.BAD_REQUEST, null);
  }

  await prisma.friends.create({
    data: { ID_User: userId, ID_Friend: friendToAdd.ID_User },
  });

  return { friendUsername: friendToAdd.Username };
};

export const listFriends = (userId: number) =>
  prisma.friends.findMany({
    where: { ID_User: userId, Blocked: false },
    include: { Friend: { select: { ID_User: true, Username: true, MMR: true } } },
  });

export const listBlockedFriends = (userId: number) =>
  prisma.friends.findMany({
    where: { ID_User: userId, Blocked: true },
    include: { Friend: { select: { ID_User: true, Username: true } } },
  });
