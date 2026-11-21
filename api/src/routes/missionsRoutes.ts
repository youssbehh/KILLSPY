import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { missionIdParamSchema } from '../validators/social';
import { getDailyMissions, claimDailyMission } from '../controllers/missionsController';

const missionsRoutes: Router = Router();

missionsRoutes.get('/daily', authMiddleware(), getDailyMissions);
missionsRoutes.post('/daily/:id/claim', authMiddleware(), validate(missionIdParamSchema, 'params'), claimDailyMission);

export default missionsRoutes;
