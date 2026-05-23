import { Router } from 'express'
import authRoutes from './authRoutes'
import usersRoutes from './usersRoutes'
import friendsRoutes from './friendsRoutes'
import shopRoutes from './shopRoutes'
import inventoryRoutes from './inventoryRoutes'
import settingsRoutes from './sessionRoutes'
import leaderboardRoutes from './leaderboardRoutes'
import gamesRoutes from './gamesRoutes'
import pingRoutes from './pingRoutes'

const rootRouter: Router = Router()

rootRouter.use('/auth', authRoutes)
rootRouter.use('/users', usersRoutes)
rootRouter.use('/friends', friendsRoutes)
rootRouter.use('/shop', shopRoutes)
rootRouter.use('/inventory', inventoryRoutes)
rootRouter.use('/settings', settingsRoutes)
rootRouter.use('/leaderboard', leaderboardRoutes)
rootRouter.use('/games', gamesRoutes)
rootRouter.use('/ping', pingRoutes)

export default rootRouter