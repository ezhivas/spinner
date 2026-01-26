import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { RequestEntity } from './request.entity';
import { PostRequestScriptService } from './post-request-script.service';
import { EnvironmentEntity } from '../environments/environment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RequestEntity, EnvironmentEntity])],
  providers: [RequestsService, PostRequestScriptService],
  controllers: [RequestsController],
  exports: [RequestsService],
})
export class RequestsModule {}
