import { NextFunction, Request, Response } from 'express';
import * as messagesService from '../services/messages.service';

export const getInbox = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inbox = await messagesService.getInbox(req.user!.ID_User);
    res.json({ inbox });
  } catch (e) { next(e); }
};

export const getConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partnerId = parseInt(req.params.userId, 10);
    if (isNaN(partnerId)) { res.status(400).json({ message: 'userId invalide' }); return; }
    const messages = await messagesService.getConversation(req.user!.ID_User, partnerId);
    res.json({ messages });
  } catch (e) { next(e); }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const receiverId = parseInt(req.params.userId, 10);
    if (isNaN(receiverId)) { res.status(400).json({ message: 'userId invalide' }); return; }
    const msg = await messagesService.sendMessage(req.user!.ID_User, receiverId, req.body.content);
    res.status(201).json({ message: msg });
  } catch (e) { next(e); }
};
