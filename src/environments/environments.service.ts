import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnvironmentEntity } from './environment.entity';
import { CreateEnvironmentDto } from './dto/create-environment.dto';

@Injectable()
export class EnvironmentsService {
  constructor(
    @InjectRepository(EnvironmentEntity)
    private readonly repo: Repository<EnvironmentEntity>,
  ) {}

  create(dto: CreateEnvironmentDto) {
    const env = this.repo.create(dto);
    return this.repo.save(env);
  }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const env = await this.repo.findOneBy({ id });
    if (!env) {
      throw new NotFoundException('Environment not found');
    }
    return env;
  }
}
