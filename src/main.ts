import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { startRunsWorker } from './runs/runs.worker';
import { LoggingInterceptor } from './common/logging.interceptor';
import { HttpExecutorService } from './http-executor/http-executor.service';
import { VariableResolverService } from './environments/variable-resolver.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('API Client')
    .setDescription('Postman-like API client')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Worker
  const dataSource = app.get(DataSource);
  const httpExecutor = app.get(HttpExecutorService);
  const variableResolver = app.get(VariableResolverService);
  startRunsWorker(dataSource, httpExecutor, variableResolver);

  await app.listen(3000);
}

bootstrap();
