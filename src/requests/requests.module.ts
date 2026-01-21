import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { RequestEntity } from './request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RequestEntity])],
  providers: [RequestsService],
  controllers: [RequestsController],
})
export class RequestsModule {}
