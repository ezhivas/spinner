import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestsModule } from './requests/requests.module';
import { EnvironmentsModule } from './environments/environments.module';
import { RunsModule } from './runs/runs.module';
import { HttpExecutorModule } from './http-executor/http-executor.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'api_client',
      autoLoadEntities: true,
      synchronize: true, // ⚠️ только для dev
    }),
    RequestsModule,
    EnvironmentsModule,
    RunsModule,
    HttpExecutorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
