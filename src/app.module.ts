import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestsModule } from './requests/requests.module';
import { EnvironmentsModule } from './environments/environments.module';
import { RunsModule } from './runs/runs.module';
import { HttpExecutorModule } from './http-executor/http-executor.module';
import { BullmqModule } from './queue/bullmq.module';
import { CollectionsModule } from './collections/collections.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
      logging: true,
    }),
    RequestsModule,
    EnvironmentsModule,
    RunsModule,
    HttpExecutorModule,
    BullmqModule,
    CollectionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
