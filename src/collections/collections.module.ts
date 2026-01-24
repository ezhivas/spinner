import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { CollectionEntity } from './collection.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CollectionEntity])],
  providers: [CollectionsService],
  controllers: [CollectionsController],
})
export class CollectionsModule {}
