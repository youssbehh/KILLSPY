import { Router } from 'express'
import authMiddleware from '../middlewares/authMiddleware'

import { getSession, setSessionDisconnected } from '../controllers/sessionController'

const sessionRoutes: Router = Router()

sessionRoutes.get('/get', authMiddleware("1"), getSession)
sessionRoutes.post('/set', authMiddleware("1"), setSessionDisconnected)

export default sessionRoutes