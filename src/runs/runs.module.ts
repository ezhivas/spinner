import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestRunEntity } from './request-run.entity';
import { RunsService } from './runs.service';
import { RunsController } from './runs.controller';
import { RequestEntity } from '../requests/request.entity';
import { EnvironmentEntity } from '../environments/environment.entity';
import { EnvironmentsModule } from '../environments/environments.module';
import { HttpExecutorModule } from '../http-executor/http-executor.module';
import { BullmqModule } from '../queue/bullmq.module';
import { PostRequestScriptService } from '../requests/post-request-script.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RequestRunEntity,
      RequestEntity,
      EnvironmentEntity,
    ]),
    EnvironmentsModule,
    HttpExecutorModule,
    BullmqModule,
  ],
  providers: [RunsService, PostRequestScriptService],
  controllers: [RunsController],
})
export class RunsModule {}
