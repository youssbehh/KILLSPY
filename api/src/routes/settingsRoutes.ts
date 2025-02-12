import { Router } from 'express'
import authMiddleware from '../middlewares/authMiddleware'

import { getSettings, setSettings } from '../controllers/settingsController'

const loanRoutes: Router = Router()

loanRoutes.get('/get', authMiddleware("1"), getSettings)
loanRoutes.post('/set', authMiddleware("1"), setSettings)

export default loanRoutes