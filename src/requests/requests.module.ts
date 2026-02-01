import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { RequestEntity } from './request.entity';
import { PostRequestScriptService } from './post-request-script.service';
import { EnvironmentEntity } from '../environments/environment.entity';
import { CurlConverterService } from './curl-converter-httpsnippet.service';

@Module({
  imports: [TypeOrmModule.forFeature([RequestEntity, EnvironmentEntity])],
  providers: [RequestsService, PostRequestScriptService, CurlConverterService],
  controllers: [RequestsController],
  exports: [RequestsService],
})
export class RequestsModule {}
