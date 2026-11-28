import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import { requireVerifiedEmail } from '../middlewares/requireVerified';
import { validate } from '../middlewares/validate';
import { sendMessageSchema, userIdParamSchema } from '../validators/social';
import { cursorQuerySchema } from '../validators/account';
import { getInbox, getConversation, sendMessage } from '../controllers/messagesController';

const messagesRoutes: Router = Router();

messagesRoutes.get('/inbox',               authMiddleware(), getInbox);
messagesRoutes.get('/dm/:userId',          authMiddleware(), validate(userIdParamSchema, 'params'), validate(cursorQuerySchema, 'query'), getConversation);
messagesRoutes.post('/dm/:userId',         authMiddleware(), requireVerifiedEmail, validate(userIdParamSchema, 'params'), validate(sendMessageSchema), sendMessage);

export default messagesRoutes;
