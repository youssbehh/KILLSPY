import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { pageQuerySchema } from '../validators/games';
import * as gamesService from '../services/games.service';

const leaderboardRoutes: Router = Router();

const list = asyncHandler(async (req, res) => {
  const { offset, limit } = req.query as unknown as { offset: number; limit: number };
  const page = await gamesService.getLeaderboardTop(limit + 1, offset);
  res.json({ leaderboard: page.slice(0, limit), hasMore: page.length > limit });
});

leaderboardRoutes.get('/', validate(pageQuerySchema, 'query'), list);
leaderboardRoutes.get('/getLeaderboard', validate(pageQuerySchema, 'query'), list); // legacy alias

/** The caller's own position in the ladder (null for guests). */
leaderboardRoutes.get('/me', authMiddleware(), asyncHandler(async (req, res) => {
  res.json({ me: await gamesService.getLeaderboardPosition(req.user!.ID_User) });
}));

export default leaderboardRoutes;
