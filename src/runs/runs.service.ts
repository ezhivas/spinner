import { Injectable, Inject } from '@nestjs/common';
import { Repository, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestRunEntity } from './request-run.entity';
import { RequestEntity } from '../requests/request.entity';
import { EnvironmentEntity } from '../environments/environment.entity';
import { Queue } from 'bullmq';
import { HttpExecutorService } from '../http-executor/http-executor.service';
import { VariableResolverService } from '../environments/variable-resolver.service';
import { PostRequestScriptService } from '../requests/post-request-script.service';

@Injectable()
export class RunsService {
  constructor(
    @InjectRepository(RequestRunEntity)
    private readonly runRepo: Repository<RequestRunEntity>,

    @InjectRepository(RequestEntity)
    private readonly requestRepo: Repository<RequestEntity>,

    @InjectRepository(EnvironmentEntity)
    private readonly envRepo: Repository<EnvironmentEntity>,

    @Inject('RUNS_QUEUE')
    private readonly queue: Queue | null,

    @Inject('IS_ELECTRON')
    private readonly isElectron: boolean,

    private readonly httpExecutor: HttpExecutorService,
    private readonly variableResolver: VariableResolverService,
    private readonly postRequestScriptService: PostRequestScriptService,
  ) {}

  async runRequest(requestId: number, environmentId?: number) {
    const request = await this.requestRepo.findOneBy({ id: requestId });
    if (!request) {
      throw new Error('Request not found');
    }

    let env: EnvironmentEntity | null = null;

    if (environmentId) {
      env = await this.envRepo.findOneBy({ id: environmentId });
    }

    const run = await this.runRepo.save({
      request,
      environment: env ?? undefined,
      status: 'PENDING',
    });

    if (this.isElectron) {
      // Electron mode: Execute synchronously without queue
      this.executeRunSync(run.id, environmentId);
    } else {
      // Docker mode: Use queue
      if (this.queue) {
        await this.queue.add('execute', {
          runId: run.id,
          environmentId,
        });
      }
    }

    return run;
  }

  // Synchronous execution for Electron mode
  private async executeRunSync(runId: number, environmentId?: number) {
    try {
      const run = await this.runRepo.findOne({
        where: { id: runId },
        relations: ['request', 'environment'],
      });

      if (!run) {
        throw new Error('Run not found');
      }

      const startTime = Date.now();

      // Resolve variables if environment is provided
      const variables = run.environment?.variables || {};
      const resolvedUrl = this.variableResolver.resolve(run.request.url, variables);
      const resolvedHeaders = this.variableResolver.resolveObject(run.request.headers || {}, variables);
      const resolvedQueryParams = this.variableResolver.resolveObject(run.request.queryParams || {}, variables);
      const resolvedBody = this.variableResolver.resolveObject(run.request.body, variables);

      // Build axios config
      const config = {
        method: run.request.method,
        url: resolvedUrl,
        headers: resolvedHeaders,
        params: resolvedQueryParams,
        data: resolvedBody,
      };

      // Execute HTTP request
      const result = await this.httpExecutor.execute(config);

      // Execute post-request script if exists
      let scriptResult;
      if (run.request.postRequestScript) {
        scriptResult = await this.postRequestScriptService.executeScript(
          run.request.postRequestScript,
          result.responseStatus || 0,
          result.responseHeaders || {},
          result.responseBody,
          run.environment,
        );

        if (!scriptResult.success) {
          console.error('Post-request script failed:', scriptResult.error);
        }
      }

      // Update run with results
      await this.runRepo.update(run.id, {
        status: result.status,
        responseStatus: result.responseStatus,
        responseHeaders: result.responseHeaders as any,
        responseBody: result.responseBody as any,
        durationMs: result.durationMs,
        error: result.error,
      });
    } catch (error: any) {
      // Update run with error
      await this.runRepo.update(runId, {
        status: 'ERROR',
        error: error.message || 'Unknown error',
        durationMs: 0,
      });
    }
  }

  async findAll() {
    return this.runRepo.find();
  }

  async findOne(id: number) {
    return this.runRepo.findOne({
      where: { id },
      relations: ['request', 'environment'],
    });
  }

  async deleteOlderThan(hours: number) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    const result = await this.runRepo.delete({
      createdAt: LessThan(cutoffDate),
    });

    return {
      deleted: result.affected || 0,
      cutoffDate: cutoffDate.toISOString(),
      hoursKept: hours,
    };
  }
}

