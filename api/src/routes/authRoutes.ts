import { Router } from 'express'
import { signup, login, guest, logout } from '../controllers/authController'

const authRoutes:Router = Router()

authRoutes.post('/signup', signup)
authRoutes.post('/login', login)
authRoutes.get('/guest', guest)
authRoutes.get('/logout', logout)

export default authRoutes