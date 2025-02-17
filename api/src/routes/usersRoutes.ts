import { Router } from 'express'
import { addUser, getAllTAgs, getOneUserById, getUsersById } from '../controllers/usersController'
import authMiddleware from '../middlewares/authMiddleware'

const usersRoutes: Router = Router()

// usersRoutes.get('/', getOwnUser)
usersRoutes.post('/add', authMiddleware("1"), addUser)
usersRoutes.get('/myUsers', authMiddleware("1"), getUsersById)
usersRoutes.get('/user/:tagUser', authMiddleware("1"), getOneUserById)
usersRoutes.get('/getAllTags', authMiddleware("1"), getAllTAgs)

export default usersRoutes