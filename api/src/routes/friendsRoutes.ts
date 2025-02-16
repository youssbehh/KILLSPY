import { Router } from 'express'
import authMiddleware from '../middlewares/authMiddleware'

import { addFriend, getFriendsByUserId, getBlockedFriends } from '../controllers/friendsController'

const loanRoutes: Router = Router()

loanRoutes.post('/add', authMiddleware("1"), addFriend)
loanRoutes.get('/getByUser', authMiddleware("1"), getFriendsByUserId)
loanRoutes.get('/getBlockedFriends/:tagClient', authMiddleware("1"), getBlockedFriends)

export default loanRoutes