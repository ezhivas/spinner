import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestRunEntity } from './request-run.entity';
import { RequestEntity } from '../requests/request.entity';
import { EnvironmentEntity } from '../environments/environment.entity';
import { HttpExecutorService } from '../http-executor/http-executor.service';
import { VariableResolverService } from '../environments/variable-resolver.service';

@Injectable()
export class RunsService {
  constructor(
    @InjectRepository(RequestRunEntity)
    private readonly runsRepo: Repository<RequestRunEntity>,

    @InjectRepository(RequestEntity)
    private readonly requestsRepo: Repository<RequestEntity>,

    @InjectRepository(EnvironmentEntity)
    private readonly envRepo: Repository<EnvironmentEntity>,

    private readonly executor: HttpExecutorService,
    private readonly resolver: VariableResolverService,
  ) {}

  async runRequest(requestId: number, environmentId?: number) {
    const request = await this.requestsRepo.findOneBy({ id: requestId });
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    let env: EnvironmentEntity | undefined;
    let variables = {};

    if (environmentId) {
      env = await this.envRepo.findOneBy({ id: environmentId });
      if (!env) {
        throw new NotFoundException('Environment not found');
      }
      variables = env.variables;
    }

    const url = this.resolver.resolve(request.url, variables);
    const headers = this.resolver.resolveObject(request.headers, variables);
    const queryParams = this.resolver.resolveObject(
      request.queryParams,
      variables,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const body = this.resolver.resolveObject(request.body, variables);

    const result = await this.executor.execute({
      method: request.method,
      url,
      headers,
      params: queryParams,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: body,
    });

    const run = this.runsRepo.create({
      request,
      environment: env,
      ...result,
    });

    return this.runsRepo.save(run);
  }

  findAll() {
    return this.runsRepo.find({
      order: { createdAt: 'DESC' },
    });
  }
}
