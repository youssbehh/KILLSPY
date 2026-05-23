import { Router } from 'express'
import authMiddleware from '../middlewares/authMiddleware'
import { validate } from '../middlewares/validate'
import { addFriendSchema } from '../validators/friends'

import { addFriend, getFriendsByUserId, getBlockedFriends } from '../controllers/friendsController'

const friendsRoutes: Router = Router()

friendsRoutes.post('/add', authMiddleware(), validate(addFriendSchema), addFriend)
friendsRoutes.get('/getByUser', authMiddleware(), getFriendsByUserId)
friendsRoutes.get('/getBlockedFriends', authMiddleware(), getBlockedFriends)

export default friendsRoutes