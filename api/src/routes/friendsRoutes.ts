import { Router } from 'express'
import authMiddleware from '../middlewares/authMiddleware'

import { addFriend, getFriendsByUserId, getBlockedFriends } from '../controllers/friendsController'

const friendsRoutes: Router = Router()

friendsRoutes.post('/add', authMiddleware("1"), addFriend)
friendsRoutes.get('/getByUser', authMiddleware("1"), getFriendsByUserId)
friendsRoutes.get('/getBlockedFriends/:ID_User', authMiddleware("1"), getBlockedFriends)

export default friendsRoutes