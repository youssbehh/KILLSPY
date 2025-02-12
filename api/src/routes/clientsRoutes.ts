import { Router } from 'express'
import { addClient, getAllTAgs, getClientsById, getOneClientById } from '../controllers/clientsController'
import authMiddleware from '../middlewares/authMiddleware'

const clientsRoutes: Router = Router()

// clientsRoutes.get('/', getOwnClient)
clientsRoutes.post('/add', authMiddleware("1"), addClient)
clientsRoutes.get('/myClients', authMiddleware("1"), getClientsById)
clientsRoutes.get('/client/:tagClient', authMiddleware("1"), getOneClientById)
clientsRoutes.get('/getAllTAgs', authMiddleware("1"), getAllTAgs)

export default clientsRoutes