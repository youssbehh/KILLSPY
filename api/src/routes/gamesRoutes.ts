import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { pageQuerySchema, recordGameSchema } from '../validators/games';
import { postGameResult, getMyStats, getMyHistory } from '../controllers/gamesController';

const gamesRoutes: Router = Router();

gamesRoutes.post('/result', authMiddleware(), validate(recordGameSchema), postGameResult);
gamesRoutes.get('/me/stats', authMiddleware(), getMyStats);
gamesRoutes.get('/me/history', authMiddleware(), validate(pageQuerySchema, 'query'), getMyHistory);

export default gamesRoutes;
