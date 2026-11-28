import { Router } from 'express'
import { signup, login, guest, logout } from '../controllers/authController'
import { authLimiter, refreshLimiter } from '../middlewares/rateLimit'
import { validate } from '../middlewares/validate'
import authMiddleware from '../middlewares/authMiddleware'
import { signupSchema, loginSchema, logoutParamsSchema, refreshSchema, guestSchema } from '../validators/auth'
import { refreshSession } from '../services/tokens.service'

import { asyncHandler } from '../utils/asyncHandler'
import { forgotPasswordSchema, resetPasswordSchema } from '../validators/account'
import * as account from '../services/account.service'

const authRoutes: Router = Router()

authRoutes.post('/signup', authLimiter, validate(signupSchema), signup)
authRoutes.post('/login', authLimiter, validate(loginSchema), login)
authRoutes.post('/guest', authLimiter, validate(guestSchema), guest)
// Trades the refresh token for a new pair. No access token needed: it is usually the expired one.
authRoutes.post('/refresh', refreshLimiter, validate(refreshSchema), asyncHandler(async (req, res) => {
  res.json(await refreshSession(req.body.refreshToken))
}))
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