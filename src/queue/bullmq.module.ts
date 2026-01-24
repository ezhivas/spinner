import { Module, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

export const RUNS_QUEUE = 'runs';

export const bullConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
};

export const runsQueue = new Queue(RUNS_QUEUE, {
  connection: bullConnection,
});

const logger = new Logger('BullmqModule');

logger.log('Runs queue initialized');

@Module({
  providers: [
    {
      provide: 'RUNS_QUEUE',
      useValue: runsQueue,
    },
  ],
  exports: ['RUNS_QUEUE'],
})
export class BullmqModule {}
