import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

import { PORT } from './secrets';
import rootRouter from './routes';
import { errorMiddleware } from './middlewares/errors';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', rootRouter);

export const prisma_client = new PrismaClient({
  log: ['error', 'info', 'warn'],
  errorFormat: 'pretty',
});

app.use(errorMiddleware);

// Démarrer le serveur et l'exporter
const server = app.listen(PORT, () => {
  console.log("server running port : ", PORT);
});

export { app, server }; // 🔥 On exporte `server` pour le fermer après les tests
