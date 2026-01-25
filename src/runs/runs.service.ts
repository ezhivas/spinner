import { Injectable, Inject } from '@nestjs/common';
import { Repository, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestRunEntity } from './request-run.entity';
import { RequestEntity } from '../requests/request.entity';
import { EnvironmentEntity } from '../environments/environment.entity';
import { Queue } from 'bullmq';
import { HttpExecutorService } from '../http-executor/http-executor.service';
import { VariableResolverService } from '../environments/variable-resolver.service';

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
      let resolvedRequest = { ...run.request };
      if (environmentId && run.environment) {
        resolvedRequest = this.variableResolver.resolveVariables(
          run.request,
          run.environment,
        );
      }

      // Execute HTTP request
      const result = await this.httpExecutor.execute(resolvedRequest);

      // Update run with results
      await this.runRepo.update(run.id, {
        status: 'SUCCESS',
        responseStatus: result.status,
        responseHeaders: result.headers,
        responseBody: result.data,
        durationMs: Date.now() - startTime,
        error: null,
      });
    } catch (error: any) {
      // Update run with error
      await this.runRepo.update(runId, {
        status: 'ERROR',
        error: error.message || 'Unknown error',
        durationMs: Date.now() - Date.now(),
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

