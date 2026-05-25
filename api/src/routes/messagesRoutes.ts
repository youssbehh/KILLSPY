import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import { getInbox, getConversation, sendMessage } from '../controllers/messagesController';

const messagesRoutes: Router = Router();

messagesRoutes.get('/inbox',               authMiddleware(), getInbox);
messagesRoutes.get('/dm/:userId',          authMiddleware(), getConversation);
messagesRoutes.post('/dm/:userId',         authMiddleware(), sendMessage);

export default messagesRoutes;
