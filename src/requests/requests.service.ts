import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestEntity } from './request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { CollectionEntity } from '../collections/collection.entity';
import { PostRequestScriptService } from './post-request-script.service';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly repo: Repository<RequestEntity>,
    private readonly scriptService: PostRequestScriptService,
  ) {}

  async create(dto: CreateRequestDto) {
    // Validate post-request script if provided
    if (dto.postRequestScript) {
      try {
        this.scriptService['validateScript'](dto.postRequestScript);
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    }

    const { collectionId, ...data } = dto;
    const request = this.repo.create(data);
    if (collectionId) {
      const collection = await this.repo.manager.findOne(CollectionEntity, {
        where: { id: collectionId },
      });
      if (collection) {
        request.collection = collection;
      }
    }
    return this.repo.save(request);
  }

  findAll(collectionId?: number) {
    if (collectionId) {
      return this.repo.find({
        where: { collectionId },
        relations: ['collection'],
      });
    }
    return this.repo.find({ relations: ['collection'] });
  }

  async findOne(id: number) {
    const request = await this.repo.findOne({
      where: { id },
      relations: ['collection'],
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    return request;
  }

  async update(id: number, dto: UpdateRequestDto) {
    // Validate post-request script if provided
    if (dto.postRequestScript) {
      try {
        this.scriptService['validateScript'](dto.postRequestScript);
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    }

    const request = await this.findOne(id);
    const { collectionId, ...data } = dto;
    Object.assign(request, data);
    if (collectionId !== undefined) {
      if (collectionId) {
        const collection = await this.repo.manager.findOne(CollectionEntity, {
          where: { id: collectionId },
        });
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
