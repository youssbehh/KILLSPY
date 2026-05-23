import { NextFunction, Request, Response } from 'express';
import * as authService from '../services/auth.service';

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.signupUser(req.body);
    res.status(201).json({ user });
  } catch (e) {
    next(e);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

export const guest = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.createGuestUser();
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10);
    const result = await authService.logoutUser(userId);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};
