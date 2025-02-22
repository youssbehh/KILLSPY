import { Router } from 'express'
import { addUser, deleteUser, updateUsername, getUsersById } from '../controllers/usersController'
import authMiddleware from '../middlewares/authMiddleware'

const usersRoutes: Router = Router()

// usersRoutes.get('/', getOwnUser)
usersRoutes.post('/add', authMiddleware("1"), addUser)
usersRoutes.get('/myUsers', authMiddleware("1"), getUsersById)
usersRoutes.get('/user/update-username/:oldUser', authMiddleware("1"), updateUsername)
usersRoutes.get('/deleteUser', authMiddleware("1"), deleteUser)

export default usersRoutes