import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionEntity } from './collection.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(CollectionEntity)
    private readonly collectionRepo: Repository<CollectionEntity>,
  ) {}

  async create(dto: CreateCollectionDto): Promise<CollectionEntity> {
    const collection = this.collectionRepo.create(dto);
    return this.collectionRepo.save(collection);
  }

  async findAll(): Promise<CollectionEntity[]> {
    return this.collectionRepo.find({ relations: ['requests'] });
  }

  async findOne(id: number): Promise<CollectionEntity | null> {
    return this.collectionRepo.findOne({
      where: { id },
      relations: ['requests'],
    });
  }

  async update(id: number, dto: Partial<CreateCollectionDto>): Promise<CollectionEntity | null> {
    await this.collectionRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.collectionRepo.delete(id);
  }
}
