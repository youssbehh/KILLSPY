import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { friendRequestSchema, idParamSchema, userIdParamSchema } from '../validators/account';
import * as social from '../services/social.service';

const friendsRoutes: Router = Router();
friendsRoutes.use(authMiddleware());

/** Friends, plus incoming and outgoing requests. */
friendsRoutes.get('/', asyncHandler(async (req, res) => {
  res.json(await social.listFriends(req.user!.ID_User));
}));

const request = asyncHandler(async (req, res) => {
  const username: string = req.body.username ?? req.body.Username;
  const result = await social.sendFriendRequest(req.user!.ID_User, req.user!.isGuest, username);
  res.status(201).json({
    ...result,
    message: result.status === 'accepted'
      ? `Tu es maintenant ami avec "${result.user.username}".`
      : `Demande envoyée à "${result.user.username}".`,
  });
});
friendsRoutes.post('/request', validate(friendRequestSchema), request);
friendsRoutes.post('/add', validate(friendRequestSchema), request); // previous name of /request

friendsRoutes.post('/requests/:id/accept', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  await social.acceptFriendRequest(req.user!.ID_User, Number(req.params.id));
  res.json({ message: 'Demande acceptée.' });
}));

/** Declines an incoming request or cancels an outgoing one. */
friendsRoutes.delete('/requests/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  await social.deleteFriendRequest(req.user!.ID_User, Number(req.params.id));
  res.json({ message: 'Demande supprimée.' });
}));

friendsRoutes.get('/blocked', asyncHandler(async (req, res) => {
  res.json({ blocked: await social.listBlocked(req.user!.ID_User) });
}));

friendsRoutes.post('/block/:userId', validate(userIdParamSchema, 'params'), asyncHandler(async (req, res) => {
  await social.blockUser(req.user!.ID_User, Number(req.params.userId));
  res.json({ message: 'Joueur bloqué.' });
}));

friendsRoutes.delete('/block/:userId', validate(userIdParamSchema, 'params'), asyncHandler(async (req, res) => {
  await social.unblockUser(req.user!.ID_User, Number(req.params.userId));
  res.json({ message: 'Joueur débloqué.' });
}));

friendsRoutes.delete('/:userId', validate(userIdParamSchema, 'params'), asyncHandler(async (req, res) => {
  await social.removeFriend(req.user!.ID_User, Number(req.params.userId));
  res.json({ message: 'Ami retiré.' });
}));

export default friendsRoutes;
