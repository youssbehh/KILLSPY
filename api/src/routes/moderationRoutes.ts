import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { banSchema, idParamSchema, reportSchema, reportsQuerySchema } from '../validators/account';
import * as social from '../services/social.service';

/** POST /reports — any player can report another one. */
export const reportsRoutes: Router = Router();

reportsRoutes.post('/', authMiddleware(), validate(reportSchema), asyncHandler(async (req, res) => {
  const { targetId, reason, details } = req.body;
  const report = await social.reportPlayer(req.user!.ID_User, targetId, reason, details);
  res.status(201).json({ ...report, message: 'Signalement envoyé.' });
}));

/** /admin/* — requires the `admin` role in the Roles table. */
export const adminRoutes: Router = Router();
adminRoutes.use(authMiddleware('admin'));

adminRoutes.get('/reports', validate(reportsQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const { status, offset, limit } = req.query as unknown as { status: 'open' | 'resolved'; offset: number; limit: number };
  res.json({ reports: await social.listReports(status, offset, limit) });
}));

adminRoutes.post('/reports/:id/resolve', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  await social.resolveReport(Number(req.params.id));
  res.json({ message: 'Signalement clos.' });
}));

adminRoutes.post('/users/:id/ban', validate(idParamSchema, 'params'), validate(banSchema), asyncHandler(async (req, res) => {
  await social.setBanned(Number(req.params.id), req.body.banned);
  res.json({ message: req.body.banned ? 'Joueur suspendu.' : 'Suspension levée.' });
}));
