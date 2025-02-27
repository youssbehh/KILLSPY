import { Router } from 'express'
import { deleteUser, updateUsername } from '../controllers/usersController'
import authMiddleware from '../middlewares/authMiddleware'

const usersRoutes: Router = Router()

// usersRoutes.get('/', getOwnUser)
usersRoutes.post('/update-username/:oldUser', authMiddleware("1"), updateUsername)
usersRoutes.put('/deleteUser/:id', authMiddleware("1"), deleteUser)

export default usersRoutes