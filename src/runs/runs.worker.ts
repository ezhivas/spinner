import { Worker } from 'bullmq';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { bullConnection } from '../queue/bullmq.module';

const logger = new Logger('RunsWorker');

export function startRunsWorker(dataSource: DataSource) {
  new Worker(
    'runs',
    async (job) => {
      logger.log(`Executing job ${job.id}`);
      // logic here
    },
    {
      connection: bullConnection,
    },
  );
}
