import { Router } from 'express'
import authMiddleware from '../middlewares/authMiddleware'

import { addInventory, myInventory } from '../controllers/inventoryController'

const inventoryRoutes: Router = Router()

inventoryRoutes.post('/add', authMiddleware("1"), addInventory)
inventoryRoutes.get('/myInventory', authMiddleware("1"), myInventory)

export default inventoryRoutes