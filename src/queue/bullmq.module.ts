import { Module, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';

export const RUNS_QUEUE = 'runs';

const logger = new Logger('BullmqModule');

// Determine if running in Electron mode
const isElectron =
  process.env.REDIS_ENABLED === 'false' || process.env.DB_TYPE === 'sqlite';

let runsQueue: Queue;

if (isElectron) {
  // Electron mode: Use in-memory queue (no Redis)
  logger.log('🔧 Queue: In-memory mode (Electron)');

  // BullMQ requires Redis, so we'll handle jobs directly without queue in Electron
  // This is a simplified in-memory implementation
  runsQueue = null as any; // Will be handled synchronously
} else {
  // Docker mode: Use Redis
  logger.log('🔧 Queue: Redis mode (Docker)');

  const bullConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  };

  runsQueue = new Queue(RUNS_QUEUE, {
    connection: bullConnection,
  });
}

logger.log('Runs queue initialized');

@Module({
  providers: [
    {
      provide: 'RUNS_QUEUE',
      useValue: runsQueue,
    },
    {
      provide: 'IS_ELECTRON',
      useValue: isElectron,
    },
  ],
  exports: ['RUNS_QUEUE', 'IS_ELECTRON'],
})
export class BullmqModule implements OnModuleDestroy {
  async onModuleDestroy() {
    if (runsQueue) {
      logger.log('Closing BullMQ queue connection...');
      await runsQueue.close();
      logger.log('BullMQ queue connection closed');
    }
  }
}
