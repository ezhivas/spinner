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
    console.log(`[RequestsService] Starting update for request ${id}`);
    console.log(
      `[RequestsService] DTO received:`,
      JSON.stringify(dto, null, 2),
    );

    // Validate post-request script if provided
    if (dto.postRequestScript) {
      try {
        console.log(`[RequestsService] Validating post-request script`);
        this.scriptService['validateScript'](dto.postRequestScript);
      } catch (error) {
        console.error(
          `[RequestsService] Script validation failed:`,
          error.message,
        );
        throw new BadRequestException(error.message);
      }
    }

    console.log(`[RequestsService] Finding request ${id}`);
    const request = await this.findOne(id);
    console.log(`[RequestsService] Request found, applying updates`);
    console.log(`[RequestsService] Auth from DTO:`, (dto as any).auth);

    const { collectionId, ...data } = dto;
    console.log(`[RequestsService] Data to assign (after spreading):`, data);
    Object.assign(request, data);
    console.log(`[RequestsService] Request.auth after assign:`, request.auth);

    if (collectionId !== undefined) {
      console.log(`[RequestsService] Updating collection reference`);
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

    console.log(`[RequestsService] Saving request to database`);
    const result = await this.repo.save(request);
    console.log(`[RequestsService] Request ${id} updated successfully`);
    console.log(`[RequestsService] Result.auth after save:`, result.auth);
    return result;
  }

  async remove(id: number) {
    const request = await this.findOne(id);
    return this.repo.remove(request);
  }
}
