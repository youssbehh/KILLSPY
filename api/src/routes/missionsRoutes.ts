import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import { getDailyMissions, claimDailyMission } from '../controllers/missionsController';

const missionsRoutes: Router = Router();

missionsRoutes.get('/daily', authMiddleware(), getDailyMissions);
missionsRoutes.post('/daily/:id/claim', authMiddleware(), claimDailyMission);

export default missionsRoutes;
