import { Injectable, Inject } from '@nestjs/common';
import { Repository, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestRunEntity } from './request-run.entity';
import { RequestEntity } from '../requests/request.entity';
import { EnvironmentEntity } from '../environments/environment.entity';
import { HttpExecutorService } from '../http-executor/http-executor.service';
import { VariableResolverService } from '../environments/variable-resolver.service';
import { PostRequestScriptService } from '../requests/post-request-script.service';

@Injectable()
export class RunsService {
  // Map для хранения AbortController'ов активных запросов
  private activeRequests = new Map<number, AbortController>();

  constructor(
    @InjectRepository(RequestRunEntity)
    private readonly runRepo: Repository<RequestRunEntity>,

    @InjectRepository(RequestEntity)
    private readonly requestRepo: Repository<RequestEntity>,

    @InjectRepository(EnvironmentEntity)
    private readonly envRepo: Repository<EnvironmentEntity>,

    @Inject('RUNS_QUEUE')
    private readonly queue: any,

    @Inject('IS_ELECTRON')
    private readonly isElectron: boolean,

    private readonly httpExecutor: HttpExecutorService,
    private readonly variableResolver: VariableResolverService,
    private readonly postRequestScriptService: PostRequestScriptService,
  ) {}

  async runRequest(requestId: number, environmentId?: number) {
    console.log(`[RunsService] Starting request ${requestId}`);
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

    console.log(
      `[RunsService] Created run ${run.id}, isElectron: ${this.isElectron}`,
    );

    if (this.isElectron) {
      // Electron mode: Execute synchronously without queue
      console.log(`[RunsService] Triggering executeRunSync for run ${run.id}`);
      this.executeRunSync(run.id).catch((error) => {
        console.error(`[RunsService] Error in executeRunSync:`, error);
      });
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
  private async executeRunSync(runId: number) {
    console.log(`[RunsService] executeRunSync started for run ${runId}`);
    const abortController = new AbortController();
    this.activeRequests.set(runId, abortController);

    try {
      const run = await this.runRepo.findOne({
        where: { id: runId },
        relations: ['request', 'environment'],
      });

      if (!run) {
        throw new Error('Run not found');
      }

      console.log(`[RunsService] Found run, updating to RUNNING`);
      // Update status to RUNNING
      await this.runRepo.update(runId, { status: 'RUNNING' });

      // Resolve variables if environment is provided
      const variables = run.environment?.variables || {};
      const resolvedUrl = this.variableResolver.resolve(
        run.request.url,
        variables,
      );
      const resolvedHeaders = this.variableResolver.resolveObject(
        run.request.headers || {},
        variables,
      );
      const resolvedQueryParams = this.variableResolver.resolveObject(
        run.request.queryParams || {},
        variables,
      );

      // Resolve body - handle both string and object
      let resolvedBody: any = run.request.body;
      if (resolvedBody) {
        if (typeof resolvedBody === 'string') {
          // If body is a string, resolve variables in it
          resolvedBody = this.variableResolver.resolve(resolvedBody, variables);
          // Try to parse as JSON if it looks like JSON
          if (
            resolvedBody.trim().startsWith('{') ||
            resolvedBody.trim().startsWith('[')
          ) {
            try {
              // Strip single-line comments (//) before parsing
              const cleanBody = resolvedBody
                .split('\n')
                .map((line) => {
                  // Remove // comments but keep URLs (http://, https://)
                  const commentIndex = line.search(/(?<!:)\/\//);
                  return commentIndex !== -1
                    ? line.substring(0, commentIndex)
                    : line;
                })
                .join('\n')
                .trim();
              resolvedBody = JSON.parse(cleanBody);
            } catch {
              // Keep as string if parsing fails
            }
          }
        } else {
          // If body is already an object, resolve variables in it
          resolvedBody = this.variableResolver.resolveObject(
            resolvedBody,
            variables,
          );
        }
      }

      // Apply authentication if configured
      if (run.request.auth && run.request.auth.type !== 'noauth') {
        const auth = run.request.auth;

        if (auth.type === 'bearer' && auth.bearer?.token) {
          const token = this.variableResolver.resolve(
            auth.bearer.token,
            variables,
          );
          resolvedHeaders['Authorization'] = `Bearer ${token}`;
        } else if (auth.type === 'basic' && auth.basic) {
          const username = this.variableResolver.resolve(
            auth.basic.username,
            variables,
          );
          const password = this.variableResolver.resolve(
            auth.basic.password,
            variables,
          );
          const credentials = Buffer.from(`${username}:${password}`).toString(
            'base64',
          );
          resolvedHeaders['Authorization'] = `Basic ${credentials}`;
        } else if (auth.type === 'apikey' && auth.apikey) {
          const key = this.variableResolver.resolve(auth.apikey.key, variables);
          const value = this.variableResolver.resolve(
            auth.apikey.value,
            variables,
          );
          if (auth.apikey.addTo === 'header') {
            resolvedHeaders[key] = value;
          } else if (auth.apikey.addTo === 'query') {
            resolvedQueryParams[key] = value;
          }
        } else if (auth.type === 'oauth2' && auth.oauth2?.accessToken) {
          const token = this.variableResolver.resolve(
            auth.oauth2.accessToken,
            variables,
          );
          resolvedHeaders['Authorization'] = `Bearer ${token}`;
        }
      }

      // Build axios config with AbortController signal
      const config = {
        method: run.request.method,
        url: resolvedUrl,
        headers: resolvedHeaders,
        params: resolvedQueryParams,
        data: resolvedBody,
        signal: abortController.signal,
      };

      console.log(`[RunsService] Executing HTTP request:`, {
        method: config.method,
        url: config.url,
      });

      // Execute HTTP request
      const result = await this.httpExecutor.execute(config);

      console.log(`[RunsService] HTTP request completed:`, {
        status: result.status,
        responseStatus: result.responseStatus,
      });

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

      console.log(`[RunsService] Run ${run.id} completed successfully`);
    } catch (error: any) {
      console.error(`[RunsService] Error executing run ${runId}:`, error);
      // Check if request was cancelled
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        await this.runRepo.update(runId, {
          status: 'ERROR',
          error: 'Request cancelled by user',
          durationMs: 0,
        });
      } else {
        // Update run with error
        await this.runRepo.update(runId, {
          status: 'ERROR',
          error: error.message || 'Unknown error',
          durationMs: 0,
        });
      }
    } finally {
      // Remove from active requests
      this.activeRequests.delete(runId);
      console.log(`[RunsService] Cleaned up run ${runId}`);
    }
  }

  async findAll() {
    return this.runRepo.find({
      relations: ['request', 'environment'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findOne(id: number) {
    return this.runRepo.findOne({
      where: { id },
      relations: ['request', 'environment'],
    });
  }

  async cancelRun(id: number) {
    const run = await this.runRepo.findOneBy({ id });
    if (!run) {
      throw new Error('Run not found');
    }

    // Check if request is active
    const abortController = this.activeRequests.get(id);
    if (abortController) {
      // Cancel the request
      abortController.abort();
      this.activeRequests.delete(id);

      return {
        cancelled: true,
        message: 'Request cancelled successfully',
      };
    }

    // If not in active requests, check if it's pending or running
    if (run.status === 'PENDING' || run.status === 'RUNNING') {
      // Update status to cancelled
      await this.runRepo.update(id, {
        status: 'ERROR',
        error: 'Request cancelled by user',
      });

      return {
        cancelled: true,
        message: 'Request marked as cancelled',
      };
    }

    return {
      cancelled: false,
      message: 'Request is not running or already completed',
    };
  }

  async remove(id: number) {
    const run = await this.runRepo.findOneBy({ id });
    if (!run) {
      throw new Error('Run not found');
    }
    await this.runRepo.remove(run);
    return { deleted: true };
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
