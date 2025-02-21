import { Router } from 'express'
import { addUser, getAllTAgs, updateUsername, getUsersById } from '../controllers/usersController'
import authMiddleware from '../middlewares/authMiddleware'

const usersRoutes: Router = Router()

// usersRoutes.get('/', getOwnUser)
usersRoutes.post('/add', authMiddleware("1"), addUser)
usersRoutes.get('/myUsers', authMiddleware("1"), getUsersById)
usersRoutes.get('/user/:oldUser', authMiddleware("1"), updateUsername)
usersRoutes.get('/getAllTags', authMiddleware("1"), getAllTAgs)

export default usersRoutes