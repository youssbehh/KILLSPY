import { Router } from 'express'
import { signup, login, guest, logout } from '../controllers/authController'
import { authLimiter } from '../middlewares/rateLimit'
import { validate } from '../middlewares/validate'
import authMiddleware from '../middlewares/authMiddleware'
import { signupSchema, loginSchema, logoutParamsSchema } from '../validators/auth'

import { asyncHandler } from '../utils/asyncHandler'
import { forgotPasswordSchema, resetPasswordSchema } from '../validators/account'
import * as account from '../services/account.service'

const authRoutes: Router = Router()

authRoutes.post('/signup', authLimiter, validate(signupSchema), signup)
authRoutes.post('/login', authLimiter, validate(loginSchema), login)
authRoutes.get('/guest', authLimiter, guest)
authRoutes.post('/logout/:id', authMiddleware(), validate(logoutParamsSchema, 'params'), logout)

authRoutes.post('/password/forgot', authLimiter, validate(forgotPasswordSchema), asyncHandler(async (req, res) => {
  await account.requestPasswordReset(req.body.email);
  // Same answer whether or not the address is known.
  res.json({ message: 'Si un compte existe pour cette adresse, un code vient de lui être envoyé.' });
}))

authRoutes.post('/password/reset', authLimiter, validate(resetPasswordSchema), asyncHandler(async (req, res) => {
  await account.resetPassword(req.body.email, req.body.code, req.body.password);
  res.json({ message: 'Mot de passe mis à jour. Tu peux te connecter.' });
}))

export default authRoutes