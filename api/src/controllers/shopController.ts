import { NextFunction, Request, Response } from 'express';
import * as shopService from '../services/shop.service';

export const getShop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const offers = await shopService.listShopOffers(req.user?.ID_User);
    res.status(200).json({ offers });
  } catch (e) {
    next(e);
  }
};

export const purchase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const offerId = parseInt(req.params.offerId, 10);
    const result = await shopService.purchaseOffer(req.user!.ID_User, offerId);
    res.status(201).json({ result });
  } catch (e) {
    next(e);
  }
};
