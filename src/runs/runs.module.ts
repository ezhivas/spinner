import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestRunEntity } from './request-run.entity';
import { RunsService } from './runs.service';
import { RunsController } from './runs.controller';
import { RequestEntity } from '../requests/request.entity';
import { EnvironmentEntity } from '../environments/environment.entity';
import { EnvironmentsModule } from '../environments/environments.module';
import { HttpExecutorModule } from '../http-executor/http-executor.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RequestRunEntity,
      RequestEntity,
      EnvironmentEntity,
    ]),
    EnvironmentsModule,
    HttpExecutorModule,
  ],
  providers: [RunsService],
  controllers: [RunsController],
})
export class RunsModule {}
