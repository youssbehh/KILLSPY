import {Router} from 'express'
import { signup, login, test_routes } from '../controllers/authController'

const authRoutes:Router = Router()

authRoutes.get('/test_routes', test_routes)

authRoutes.post('/signup', signup)
authRoutes.post('/login', login)

export default authRoutes