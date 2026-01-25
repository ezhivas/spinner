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

  async importFromPostman(postmanEnv: any) {
    // Postman environment format:
    // {
    //   "name": "Environment Name",
    //   "values": [
    //     { "key": "BASE_URL", "value": "https://api.example.com", "enabled": true },
    //     { "key": "API_KEY", "value": "abc123", "enabled": true }
    //   ]
    // }

    const variables: Record<string, string> = {};

    if (postmanEnv.values && Array.isArray(postmanEnv.values)) {
      postmanEnv.values.forEach((item: any) => {
        if (item.enabled !== false) {
          variables[item.key] = item.value || '';
        }
      });
    }

    const env = this.repo.create({
      name: postmanEnv.name || 'Imported Environment',
      variables,
    });

    return this.repo.save(env);
  }

  async exportToPostman(id: number) {
    const env = await this.findOne(id);

    // Convert to Postman format
    const values = Object.entries(env.variables || {}).map(([key, value]) => ({
      key,
      value,
      enabled: true,
      type: 'default',
    }));

    return {
      id: env.id.toString(),
      name: env.name,
      values,
      _postman_variable_scope: 'environment',
      _postman_exported_at: new Date().toISOString(),
      _postman_exported_using: 'SpinneR API Client',
    };
  }
}
