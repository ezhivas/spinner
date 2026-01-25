import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RequestsModule } from './requests/requests.module';
import { EnvironmentsModule } from './environments/environments.module';
import { RunsModule } from './runs/runs.module';
import { HttpExecutorModule } from './http-executor/http-executor.module';
import { BullmqModule } from './queue/bullmq.module';
import { CollectionsModule } from './collections/collections.module';
import { BackupModule } from './backup/backup.module';
import { getDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    RequestsModule,
    EnvironmentsModule,
    RunsModule,
    HttpExecutorModule,
    BullmqModule,
    CollectionsModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
