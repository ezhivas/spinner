import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { CollectionEntity } from './collection.entity';
import { RequestsModule } from '../requests/requests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CollectionEntity]),
    RequestsModule,
  ],
  providers: [CollectionsService],
  controllers: [CollectionsController],
})
export class CollectionsModule {}
