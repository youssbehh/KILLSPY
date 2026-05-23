import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { offerIdParamSchema } from '../validators/shop';
import { getShop, purchase } from '../controllers/shopController';

const shopRoutes: Router = Router();

shopRoutes.get('/', authMiddleware(), getShop);
shopRoutes.post('/purchase/:offerId', authMiddleware(), validate(offerIdParamSchema, 'params'), purchase);

export default shopRoutes;
