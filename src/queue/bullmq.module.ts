import { Module, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';

export const RUNS_QUEUE = 'runs';

const logger = new Logger('BullmqModule');

// Determine if running in Electron mode
const isElectron =
  process.env.REDIS_ENABLED === 'false' || process.env.DB_TYPE === 'sqlite';

let runsQueue: Queue | null = null;

if (isElectron) {
  // Electron mode: Use in-memory queue (no Redis)
  logger.log('🔧 Queue: In-memory mode (Electron/SQLite)');
  runsQueue = null; // Will be handled synchronously
} else {
  // Docker mode: Use Redis with error handling
  logger.log('🔧 Queue: Redis mode (Docker)');

  const bullConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times: number) => {
      if (times > 10) {
        logger.error('❌ Redis connection failed after 10 retries');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 100, 3000);
      logger.warn(`⚠️  Redis connection retry ${times} in ${delay}ms`);
      return delay;
    },
  };

  try {
    runsQueue = new Queue(RUNS_QUEUE, {
      connection: bullConnection,
    });

    // Handle connection errors
    runsQueue.on('error', (error) => {
      logger.error('❌ Queue error:', error.message);
    });

    // Note: 'failed' event is only available on Worker, not Queue
    // Worker events are handled in runs.worker.ts

    logger.log('✅ Runs queue initialized with Redis');
  } catch (error) {
    logger.error('❌ Failed to initialize Redis queue:', error);
    logger.warn('⚠️  Falling back to synchronous execution');
    runsQueue = null;
  }
}

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
