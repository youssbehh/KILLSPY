import { Router } from 'express'

import { getPing } from '../controllers/pingController'

const pingRoutes: Router = Router()

pingRoutes.get('/getPing', getPing)

export default pingRoutes