import { NextFunction, Request, Response } from 'express';
import * as inventoryService from '../services/inventory.service';

export const getInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const owned = await inventoryService.listOwned(req.user!.ID_User);
    const equipped = await inventoryService.getEquippedMap(req.user!.ID_User);
    res.status(200).json({ owned, equipped });
  } catch (e) {
    next(e);
  }
};

export const equip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await inventoryService.equip(req.user!.ID_User, req.body.itemId);
    res.status(200).json({ equipped: result });
  } catch (e) {
    next(e);
  }
};

export const unequip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await inventoryService.unequip(req.user!.ID_User, req.params.type as any);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
};
