import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { ALLOWED_ORIGINS } from './secrets';
import rootRouter from './routes';
import { errorMiddleware } from './middlewares/errors';
import { apiLimiter } from './middlewares/rateLimit';
import { logger } from './lib/logger';

export const buildApp = () => {
  const app = express();

  app.use(helmet());

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS bloqué pour : ${origin}`));
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '100kb' }));

  if (process.env.NODE_ENV !== 'test') {
    app.use(pinoHttp({
      logger,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }));
  }

  app.use('/api', apiLimiter, rootRouter);
  app.use(errorMiddleware);

  return app;
};

export const app = buildApp();
