import { Router } from 'express'
import authMiddleware from '../middlewares/authMiddleware'

import { getSession, setSessionDisconnected } from '../controllers/sessionController'

const sessionRoutes: Router = Router()

sessionRoutes.get('/get', authMiddleware(), getSession)
sessionRoutes.post('/set', authMiddleware(), setSessionDisconnected)

export default sessionRoutes