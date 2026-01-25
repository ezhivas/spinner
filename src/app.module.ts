import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RequestsModule } from './requests/requests.module';
import { EnvironmentsModule } from './environments/environments.module';
import { RunsModule } from './runs/runs.module';
import { HttpExecutorModule } from './http-executor/http-executor.module';
import { BullmqModule } from './queue/bullmq.module';
import { CollectionsModule } from './collections/collections.module';
import { BackupModule } from './backup/backup.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
        logging: config.get<boolean>('LOG_DB_QUERIES') || false,
      }),
    }),
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
