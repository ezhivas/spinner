import { Injectable, Inject } from '@nestjs/common';
import { Repository, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestRunEntity } from './request-run.entity';
import { RequestEntity } from '../requests/request.entity';
import { EnvironmentEntity } from '../environments/environment.entity';
import { Queue } from 'bullmq';

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
    private readonly queue: Queue,
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

    await this.queue.add('execute', {
      runId: run.id,
      environmentId,
    });

    return run;
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

