import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { createGuildSchema, guildIdParamSchema, guildSearchQuerySchema, userIdParamSchema } from '../validators/social';
import { listGuilds, getMyGuild, createGuild, joinGuild, leaveGuild, kickMember } from '../controllers/guildsController';

const guildsRoutes: Router = Router();

guildsRoutes.get('/',           authMiddleware(), validate(guildSearchQuerySchema, 'query'), listGuilds);
guildsRoutes.get('/me',         authMiddleware(), getMyGuild);
guildsRoutes.post('/',          authMiddleware(), validate(createGuildSchema), createGuild);
guildsRoutes.post('/:id/join',  authMiddleware(), validate(guildIdParamSchema, 'params'), joinGuild);
guildsRoutes.delete('/me',      authMiddleware(), leaveGuild);
guildsRoutes.delete('/kick/:userId', authMiddleware(), validate(userIdParamSchema, 'params'), kickMember);

export default guildsRoutes;
