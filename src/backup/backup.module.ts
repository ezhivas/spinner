import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { RequestEntity } from '../requests/request.entity';
import { CollectionEntity } from '../collections/collection.entity';
import { EnvironmentEntity } from '../environments/environment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RequestEntity,
      CollectionEntity,
      EnvironmentEntity,
    ]),
  ],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
