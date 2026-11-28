import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import { requireVerifiedEmail } from '../middlewares/requireVerified';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { createGuildSchema, guildIdParamSchema, userIdParamSchema } from '../validators/social';
import {
  chatMessageSchema,
  cursorQuerySchema,
  guildInviteSchema,
  guildListQuerySchema,
  guildRoleSchema,
  idParamSchema,
  updateGuildSchema,
} from '../validators/account';
import { getMyGuild, createGuild, joinGuild, leaveGuild, kickMember } from '../controllers/guildsController';
import * as guilds from '../services/guilds.service';
import * as admin from '../services/guildAdmin.service';

const guildsRoutes: Router = Router();
guildsRoutes.use(authMiddleware());

guildsRoutes.get('/', validate(guildListQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const { search, offset, limit } = req.query as unknown as { search?: string; offset: number; limit: number };
  const list = await guilds.listGuilds(search, offset, limit + 1);
  res.json({ guilds: list.slice(0, limit), hasMore: list.length > limit, createCost: guilds.GUILD_CREATE_COST });
}));

guildsRoutes.get('/me', getMyGuild);
guildsRoutes.post('/', requireVerifiedEmail, validate(createGuildSchema), createGuild);
guildsRoutes.post('/:id/join', requireVerifiedEmail, validate(guildIdParamSchema, 'params'), joinGuild);
guildsRoutes.delete('/me', leaveGuild);
guildsRoutes.delete('/kick/:userId', validate(userIdParamSchema, 'params'), kickMember);

// ── Leader tools ────────────────────────────────────────────────────────────
guildsRoutes.patch('/me', validate(updateGuildSchema), asyncHandler(async (req, res) => {
  res.json({ guild: await admin.updateGuild(req.user!.ID_User, req.body) });
}));

guildsRoutes.delete('/me/dissolve', asyncHandler(async (req, res) => {
  await admin.dissolveGuild(req.user!.ID_User);
  res.json({ message: 'Guilde dissoute.' });
}));

guildsRoutes.post('/members/:userId/role', validate(userIdParamSchema, 'params'), validate(guildRoleSchema), asyncHandler(async (req, res) => {
  res.json({ guild: await admin.setMemberRole(req.user!.ID_User, Number(req.params.userId), req.body.role) });
}));

guildsRoutes.post('/members/:userId/transfer', validate(userIdParamSchema, 'params'), asyncHandler(async (req, res) => {
  res.json({ guild: await admin.transferLeadership(req.user!.ID_User, Number(req.params.userId)) });
}));

// ── Chat ────────────────────────────────────────────────────────────────────
guildsRoutes.get('/me/messages', validate(cursorQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const { before, limit } = req.query as unknown as { before?: number; limit?: number };
  res.json(await admin.getGuildMessages(req.user!.ID_User, before, limit));
}));

guildsRoutes.post('/me/messages', requireVerifiedEmail, validate(chatMessageSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ message: await admin.postGuildMessage(req.user!.ID_User, req.body.content) });
}));

// ── Invitations ─────────────────────────────────────────────────────────────
guildsRoutes.get('/invites', asyncHandler(async (req, res) => {
  res.json({ invites: await admin.listMyInvites(req.user!.ID_User) });
}));

guildsRoutes.post('/invites', requireVerifiedEmail, validate(guildInviteSchema), asyncHandler(async (req, res) => {
  const result = await admin.invitePlayer(req.user!.ID_User, req.body.username);
  res.status(201).json({ message: `Invitation envoyée à "${result.username}".` });
}));

guildsRoutes.post('/invites/:id/accept', requireVerifiedEmail, validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  res.json({ guild: await admin.acceptInvite(req.user!.ID_User, Number(req.params.id)) });
}));

guildsRoutes.delete('/invites/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  await admin.declineInvite(req.user!.ID_User, Number(req.params.id));
  res.json({ message: 'Invitation refusée.' });
}));

export default guildsRoutes;
