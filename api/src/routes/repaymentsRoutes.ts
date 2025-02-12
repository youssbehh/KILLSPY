import { Router } from 'express'
import authMiddleware from '../middlewares/authMiddleware'

import { addRepayment, myRepayments } from '../controllers/repaymentsController'

const loanRoutes: Router = Router()

loanRoutes.post('/add', authMiddleware("1"), addRepayment)
loanRoutes.get('/myRepayments', authMiddleware("1"), myRepayments)

export default loanRoutes