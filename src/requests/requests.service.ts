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

  findAll(collectionId?: number) {
    if (collectionId) {
      return this.repo.find({ where: { collectionId }, relations: ['collection'] });
    }
    return this.repo.find({ relations: ['collection'] });
  }

  async findOne(id: number) {
    const request = await this.repo.findOne({ where: { id }, relations: ['collection'] });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    return request;
  }

  async update(id: number, dto: UpdateRequestDto) {
    const request = await this.findOne(id);
    const { collectionId, ...data } = dto;
    Object.assign(request, data);
    if (collectionId !== undefined) {
      if (collectionId) {
        const collection = await this.repo.manager.findOne(CollectionEntity, { where: { id: collectionId } });
        if (collection) {
          request.collection = collection;
        }
      } else {
        request.collection = null;
      }
    }
    return this.repo.save(request);
  }

  async remove(id: number) {
    const request = await this.findOne(id);
    return this.repo.remove(request);
  }
}
