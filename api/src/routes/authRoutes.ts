import { Router } from 'express'
import { signup, login, guest, logout } from '../controllers/authController'
import { authLimiter } from '../middlewares/rateLimit'
import { validate } from '../middlewares/validate'
import { signupSchema, loginSchema, logoutParamsSchema } from '../validators/auth'

const authRoutes: Router = Router()

authRoutes.post('/signup', authLimiter, validate(signupSchema), signup)
authRoutes.post('/login', authLimiter, validate(loginSchema), login)
authRoutes.get('/guest', authLimiter, guest)
authRoutes.post('/logout/:id', validate(logoutParamsSchema, 'params'), logout)

export default authRoutes