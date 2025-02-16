import { Router } from 'express'
import authRoutes from './authRoutes'
import usersRoutes from './usersRoutes'
import friendsRoutes from './friendsRoutes'
import repaymentsRoutes from './repaymentsRoutes'
import settingsRoutes from './settingsRoutes'

const rootRouter: Router = Router()

rootRouter.use('/auth', authRoutes)
rootRouter.use('/users', usersRoutes)
rootRouter.use('/friends', friendsRoutes)
rootRouter.use('/repayments', repaymentsRoutes)
rootRouter.use('/settings', settingsRoutes)

export default rootRouter