import { Router } from 'express'
import authRoutes from './authRoutes'
import usersRoutes from './usersRoutes'
import friendsRoutes from './friendsRoutes'
import inventoryRoutes from './inventoryRoutes'
import settingsRoutes from './sessionRoutes'
import leaderboardRoutes from './leaderboardRoutes'
import pingRoutes from './pingRoutes'

const rootRouter: Router = Router()

rootRouter.use('/auth', authRoutes)
rootRouter.use('/users', usersRoutes)
rootRouter.use('/friends', friendsRoutes)
rootRouter.use('/inventory', inventoryRoutes)
rootRouter.use('/settings', settingsRoutes)
rootRouter.use('/leaderbord', leaderboardRoutes)
rootRouter.use('/ping', pingRoutes)

export default rootRouter