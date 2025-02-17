import { Router } from 'express'
import { signup, login, guest } from '../controllers/authController'

const authRoutes:Router = Router()

authRoutes.post('/signup', signup)
authRoutes.post('/login', login)
authRoutes.get('/guest', guest)

export default authRoutes