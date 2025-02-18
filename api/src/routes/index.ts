import { Router } from 'express'
import authRoutes from './authRoutes'
import usersRoutes from './usersRoutes'
import friendsRoutes from './friendsRoutes'
import inventoryRoutes from './inventoryRoutes'
import settingsRoutes from './sessionRoutes'

const rootRouter: Router = Router()

rootRouter.use('/auth', authRoutes)
rootRouter.use('/users', usersRoutes)
rootRouter.use('/friends', friendsRoutes)
rootRouter.use('/inventory', inventoryRoutes)
rootRouter.use('/settings', settingsRoutes)

export default rootRouter