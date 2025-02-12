import { Router } from 'express'
import authMiddleware from '../middlewares/authMiddleware'

import { addLoan, getLoansByUserId, getLoansByClientTag } from '../controllers/loansController'

const loanRoutes: Router = Router()

loanRoutes.post('/add', authMiddleware("1"), addLoan)
loanRoutes.get('/getByUser', authMiddleware("1"), getLoansByUserId)
loanRoutes.get('/getByClientTag/:tagClient', authMiddleware("1"), getLoansByClientTag)

export default loanRoutes