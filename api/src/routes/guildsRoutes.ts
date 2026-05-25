import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import { listGuilds, getMyGuild, createGuild, joinGuild, leaveGuild, kickMember } from '../controllers/guildsController';

const guildsRoutes: Router = Router();

guildsRoutes.get('/',           authMiddleware(), listGuilds);
guildsRoutes.get('/me',         authMiddleware(), getMyGuild);
guildsRoutes.post('/',          authMiddleware(), createGuild);
guildsRoutes.post('/:id/join',  authMiddleware(), joinGuild);
guildsRoutes.delete('/me',      authMiddleware(), leaveGuild);
guildsRoutes.delete('/kick/:userId', authMiddleware(), kickMember);

export default guildsRoutes;
