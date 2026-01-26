import { Worker, Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { HttpExecutorService } from '../http-executor/http-executor.service';
import { VariableResolverService } from '../environments/variable-resolver.service';
import { PostRequestScriptService } from '../requests/post-request-script.service';
import { RequestRunEntity } from './request-run.entity';

export function startRunsWorker(
  dataSource: DataSource,
  httpExecutor: HttpExecutorService,
  variableResolver: VariableResolverService,
  postRequestScriptService: PostRequestScriptService,
) {
  const logger = new Logger('RunsWorker');

  // Check if running in Electron mode
  const isElectron = process.env.REDIS_ENABLED === 'false' || process.env.DB_TYPE === 'sqlite';

  if (isElectron) {
    logger.log('⏭️  Skipping runs worker (Electron mode - using synchronous execution)');
    return;
  }

  logger.log('Initializing runs worker (Docker mode)');

  const bullConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  };

  const worker = new Worker(
    'runs',
    async (job: Job) => {
      logger.log(`Processing run ${job.data.runId}`);

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // ...existing code...
        const runRepo = queryRunner.manager.getRepository(RequestRunEntity);
        const run = await runRepo.findOne({
          where: { id: job.data.runId },
          relations: ['request', 'environment'],
        });

        if (!run) throw new Error('Run not found');

        const variables = run.environment?.variables || {};
        const resolvedUrl = variableResolver.resolve(run.request.url, variables);
        const resolvedHeaders = variableResolver.resolveObject(run.request.headers || {}, variables);
        const resolvedQueryParams = variableResolver.resolveObject(run.request.queryParams || {}, variables);
        const resolvedBody = variableResolver.resolveObject(run.request.body, variables);

        const config = {
          method: run.request.method,
          url: resolvedUrl,
          headers: resolvedHeaders,
          params: resolvedQueryParams,
          data: resolvedBody,
        };

        const result = await httpExecutor.execute(config);

        // Execute post-request script if exists
        if (run.request.postRequestScript) {
          const scriptResult = await postRequestScriptService.executeScript(
            run.request.postRequestScript,
            result.responseStatus || 0,
            result.responseHeaders || {},
            result.responseBody,
            run.environment,
          );

          if (!scriptResult.success) {
            logger.error(`Post-request script failed for run ${run.id}: ${scriptResult.error}`);
          }
        }

        run.status = result.status;
        run.responseStatus = result.responseStatus;
        run.responseHeaders = result.responseHeaders;
        run.responseBody = result.responseBody;
        run.error = result.error;
        run.durationMs = result.durationMs;

        await runRepo.save(run);
        await queryRunner.commitTransaction();
        logger.log(`Run ${run.id} completed with status ${run.status}`);
      } catch (e) {
        await queryRunner.rollbackTransaction();
        logger.error(`Job ${job.id} failed: ${e.message}`);

        // Trying to salvage the situation: update status to ERROR outside the transaction
        try {
          const runRepo = dataSource.getRepository(RequestRunEntity);
          await runRepo.update(job.data.runId, {
            status: 'ERROR',
            error: e.message,
            durationMs: 0,
          });
        } catch (dbError) {
          logger.error('Failed to update run status to ERROR', dbError);
        }
      } finally {
        await queryRunner.release();
      }
    },
    {
      connection: bullConnection,
      lockDuration: 120000, // 120 seconds (2 minutes) - enough for slow HTTP requests + scripts
      stalledInterval: 30000, // Check for stalled jobs every 30 seconds
      maxStalledCount: 2, // Allow 2 stalls before failing permanently
      concurrency: 5, // Process up to 5 jobs in parallel
    },
  );

  worker.on('ready', () => logger.log('Runs worker is ready'));
  worker.on('error', (err) => logger.error('Runs worker error', err));
  worker.on('failed', (job, err) => logger.error(`Job ${job?.id} failed`, err));
  worker.on('stalled', (jobId) => logger.warn(`Job ${jobId} stalled - may be taking too long`));
}
