import {PrismaClient} from "@prisma/client"
import { logger } from "../config/logger";
export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
});
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.info('Query: ' + e.query);
    logger.info('Duration: ' + e.duration + 'ms');
  });
}
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
