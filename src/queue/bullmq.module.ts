import { Module, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

export const RUNS_QUEUE = 'runs';

const logger = new Logger('BullmqModule');

let runsQueue: any = null;
let isElectron = false;

@Module({
  providers: [
    {
      provide: 'RUNS_QUEUE',
      useFactory: () => runsQueue,
    },
    {
      provide: 'IS_ELECTRON',
      useFactory: () => isElectron,
    },
  ],
  exports: ['RUNS_QUEUE', 'IS_ELECTRON'],
})
export class BullmqModule implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Determine if running in Electron mode
    isElectron =
      process.env.REDIS_ENABLED === 'false' || process.env.DB_TYPE === 'sqlite';

    if (!isElectron) {
      // Docker mode: Use Redis with error handling
      logger.log('🔧 Queue: Redis mode (Docker)');

      // Dynamic import to avoid loading BullMQ in Electron mode
      const { Queue } = await import('bullmq');

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
        runsQueue.on('error', (error: Error) => {
          logger.error('❌ Queue error:', error.message);
        });

        logger.log('✅ Runs queue initialized with Redis');
      } catch (error) {
        logger.error('❌ Failed to initialize Redis queue:', error);
        logger.warn('⚠️  Falling back to synchronous execution');
        runsQueue = null;
      }
    } else {
      // Electron mode: Log that Redis is disabled
      logger.log('🔧 Queue: In-memory mode (Electron/SQLite) - Redis disabled');
      runsQueue = null;
    }
  }
  async onModuleDestroy() {
    if (runsQueue) {
      logger.log('Closing BullMQ queue connection...');
      await runsQueue.close();
      logger.log('BullMQ queue connection closed');
    }
  }
}
