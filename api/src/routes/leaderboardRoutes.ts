import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboardController';

const leaderboardRoutes: Router = Router();

leaderboardRoutes.get('/', getLeaderboard);
leaderboardRoutes.get('/getLeaderboard', getLeaderboard); // legacy alias

export default leaderboardRoutes;
