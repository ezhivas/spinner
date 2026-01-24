import { Worker, Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { bullConnection } from '../queue/bullmq.module';
import { HttpExecutorService } from '../http-executor/http-executor.service';
import { VariableResolverService } from '../environments/variable-resolver.service';
import { RequestRunEntity } from './request-run.entity';

const logger = new Logger('RunsWorker');

export function startRunsWorker(
  dataSource: DataSource,
  httpExecutor: HttpExecutorService,
  variableResolver: VariableResolverService,
) {
  new Worker(
    'runs',
    async (job: Job) => {
      logger.log(`Processing run ${job.data.runId}`);

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
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

        // Пытаемся спасти ситуацию: обновляем статус на ERROR вне транзакции
        try {
          const runRepo = dataSource.getRepository(RequestRunEntity); // Берем репозиторий напрямую
          await runRepo.update(job.data.runId, {
            status: 'ERROR',
            error: e.message, // Сохраняем текст ошибки, чтобы видеть в UI
            durationMs: 0,    // Или посчитать время до падения
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
    },
  );
}
