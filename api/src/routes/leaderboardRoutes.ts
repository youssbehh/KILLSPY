import { Router } from 'express'

import { getLeaderboard, setLeaderboard } from '../controllers/leaderboardController'

const leaderboardRoutes: Router = Router()

leaderboardRoutes.get('/getLeaderboard', getLeaderboard)
leaderboardRoutes.post('/setLeaderboard', setLeaderboard)

export default leaderboardRoutes