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

  async update(id: number, dto: Partial<CreateEnvironmentDto>) {
    const env = await this.findOne(id);
    // If variables is an empty object, don't update it
    if (dto.variables && Object.keys(dto.variables).length === 0) {
      delete dto.variables;
    }
    Object.assign(env, dto);
    return this.repo.save(env);
  }

  async remove(id: number) {
    const env = await this.findOne(id);
    return this.repo.remove(env);
  }

  async updateVariables(id: number, newVariables: Record<string, string>) {
    const env = await this.findOne(id);
    env.variables = { ...env.variables, ...newVariables };
    return this.repo.save(env);
  }

  async deleteVariable(id: number, key: string) {
    const env = await this.findOne(id);
    if (env.variables[key] !== undefined) {
      delete env.variables[key];
      return this.repo.save(env);
    }
    throw new NotFoundException(`Variable '${key}' not found in environment`);
  }
}
