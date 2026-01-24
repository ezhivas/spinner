import { Worker, Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { RequestRunEntity } from './request-run.entity';
import { EnvironmentEntity } from '../environments/environment.entity';

export function createRunsWorker(dataSource: DataSource) {
  return new Worker(
    'runs',
    async (job: Job) => {
      const runRepo = dataSource.getRepository(RequestRunEntity);
      const envRepo = dataSource.getRepository(EnvironmentEntity);

      const { environmentId } = job.data;

      let env: EnvironmentEntity | null = null;

      if (environmentId) {
        env = await envRepo.findOneBy({ id: environmentId });
      }

      await runRepo.update(job.data.runId, {
        status: 'SUCCESS',
      });
    },
    {
      connection: {
        host: 'localhost',
        port: 6379,
      },
    },
  );
}
