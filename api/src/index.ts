import http from 'http';
import { PORT, NODE_ENV } from './secrets';
import { app } from './app';
import { prisma } from './lib/prisma';
import { logger } from './lib/logger';
import { attachSockets } from './sockets';
import { startCronJobs } from './jobs/cronJobs';

const httpServer = http.createServer(app);
const io = attachSockets(httpServer);

startCronJobs();

const server = httpServer.listen(PORT, () => {
  logger.info({ port: PORT, env: NODE_ENV }, 'server running (HTTP + sockets)');
});

export const prisma_client = prisma;
export { app, server, io };
