import { Router } from 'express'
import { deleteUser, getMe, updateUsername } from '../controllers/usersController'
import authMiddleware from '../middlewares/authMiddleware'
import { authLimiter } from '../middlewares/rateLimit'
import { validate } from '../middlewares/validate'
import { asyncHandler } from '../utils/asyncHandler'
import { updateUsernameSchema, userIdParamSchema } from '../validators/users'
import {
  changePasswordSchema,
  idParamSchema,
  searchQuerySchema,
  upgradeGuestSchema,
  verifyEmailSchema,
} from '../validators/account'
import * as account from '../services/account.service'
import * as social from '../services/social.service'

const usersRoutes: Router = Router()

usersRoutes.get('/me', authMiddleware(), getMe)
usersRoutes.post('/update-username', authMiddleware(), validate(updateUsernameSchema), updateUsername)
usersRoutes.put('/deleteUser/:id', authMiddleware(), validate(userIdParamSchema, 'params'), deleteUser)

usersRoutes.post('/change-password', authLimiter, authMiddleware(), validate(changePasswordSchema), asyncHandler(async (req, res) => {
  const result = await account.changePassword(req.user!.ID_User, req.body.currentPassword, req.body.newPassword)
  res.json({ ...result, message: 'Mot de passe mis à jour.' })
}))

/** Turns the current guest into a full account, keeping its progress. */
usersRoutes.post('/upgrade-guest', authLimiter, authMiddleware(), validate(upgradeGuestSchema), asyncHandler(async (req, res) => {
  res.json(await account.upgradeGuest(req.user!.ID_User, req.body))
}))

usersRoutes.post('/email/send', authLimiter, authMiddleware(), asyncHandler(async (req, res) => {
  await account.sendVerificationEmail(req.user!.ID_User)
  res.json({ message: 'Code envoyé.' })
}))

usersRoutes.post('/email/verify', authLimiter, authMiddleware(), validate(verifyEmailSchema), asyncHandler(async (req, res) => {
  await account.verifyEmail(req.user!.ID_User, req.body.code)
  res.json({ message: 'Adresse vérifiée.' })
}))

usersRoutes.get('/search', authMiddleware(), validate(searchQuerySchema, 'query'), asyncHandler(async (req, res) => {
  res.json({ players: await social.searchPlayers(req.user!.ID_User, String(req.query.q)) })
}))

usersRoutes.get('/:id/profile', authMiddleware(), validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  res.json({ profile: await social.getPublicProfile(req.user!.ID_User, Number(req.params.id)) })
}))

export default usersRoutes
