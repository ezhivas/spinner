import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestEntity } from './request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { CollectionEntity } from '../collections/collection.entity';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly repo: Repository<RequestEntity>,
  ) {}

  async create(dto: CreateRequestDto) {
    const { collectionId, ...data } = dto;
    const request = this.repo.create(data);
    if (collectionId) {
      const collection = await this.repo.manager.findOne(CollectionEntity, { where: { id: collectionId } });
      if (collection) {
        request.collection = collection;
      }
    }
    return this.repo.save(request);
  }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const request = await this.repo.findOneBy({ id });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    return request;
  }

  async update(id: number, dto: UpdateRequestDto) {
    const request = await this.findOne(id);
    Object.assign(request, dto);
    return this.repo.save(request);
  }

  async remove(id: number) {
    const request = await this.findOne(id);
    return this.repo.remove(request);
  }
}
