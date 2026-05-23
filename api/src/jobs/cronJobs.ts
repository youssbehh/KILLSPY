import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const deleteMarkedUsers = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.users.deleteMany({
    where: {
      archived: true,
      deletionDate: { lte: thirtyDaysAgo }
    }
  });

  if (result.count > 0) {
    logger.info({ deleted: result.count }, 'cron: archived accounts purged');
  }
};

cron.schedule('0 0 * * *', deleteMarkedUsers);