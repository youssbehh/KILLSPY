import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { equipBodySchema, unequipParamSchema } from '../validators/shop';
import { getInventory, equip, unequip } from '../controllers/inventoryController';

const inventoryRoutes: Router = Router();

inventoryRoutes.get('/', authMiddleware(), getInventory);
inventoryRoutes.post('/equip', authMiddleware(), validate(equipBodySchema), equip);
inventoryRoutes.delete('/equip/:type', authMiddleware(), validate(unequipParamSchema, 'params'), unequip);

export default inventoryRoutes;
