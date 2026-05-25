import { Router } from 'express'
import { deleteUser, getMe, updateUsername } from '../controllers/usersController'
import authMiddleware from '../middlewares/authMiddleware'
import { validate } from '../middlewares/validate'
import { updateUsernameSchema, userIdParamSchema } from '../validators/users'

const usersRoutes: Router = Router()

usersRoutes.get('/me', authMiddleware(), getMe)
usersRoutes.post('/update-username', authMiddleware(), validate(updateUsernameSchema), updateUsername)
usersRoutes.put('/deleteUser/:id', authMiddleware(), validate(userIdParamSchema, 'params'), deleteUser)

export default usersRoutes