import { Router } from 'express'
import { signup, login } from '../controllers/authController'

const authRoutes:Router = Router()

authRoutes.post('/signup', signup)
authRoutes.post('/login', login)

export default authRoutes