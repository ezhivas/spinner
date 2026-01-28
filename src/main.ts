import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { startRunsWorker } from './runs/runs.worker';
import { LoggingInterceptor } from './common/logging.interceptor';
import { HttpExecutorService } from './http-executor/http-executor.service';
import { VariableResolverService } from './environments/variable-resolver.service';
import { PostRequestScriptService } from './requests/post-request-script.service';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';

// Load environment variables as early as possible
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Increase payload limit for JSON and URL-encoded requests
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Global validation pipe with transformation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
    }),
  );

  // Global logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Set global API prefix (all routes will be under /api/*)
  app.setGlobalPrefix('api');

  // Check if running in Electron mode
  const isElectron = process.env.DB_TYPE === 'sqlite';

  if (isElectron) {
    console.log('🚀 Running in Electron mode');
    // Serve static files (frontend) in Electron mode
    app.useStaticAssets(join(__dirname, '..', 'public'));
    console.log(
      '📁 Serving static files from:',
      join(__dirname, '..', 'public'),
    );
  } else {
    console.log('🚀 Running in Docker mode');
  }

  // Swagger (on separate path to avoid collision with API prefix)
  const config = new DocumentBuilder()
    .setTitle('API Client')
    .setDescription('Postman-like API client')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Worker
  try {
    const dataSource = app.get(DataSource);
    const httpExecutor = app.get(HttpExecutorService);
    const variableResolver = app.get(VariableResolverService);
    const postRequestScriptService = app.get(PostRequestScriptService);
    await startRunsWorker(
      dataSource,
      httpExecutor,
      variableResolver,
      postRequestScriptService,
    );
    console.log('✅ Runs worker started successfully');
  } catch (error) {
    console.error('❌ Failed to start runs worker:', error);
  }

  app.enableCors();

  // Use dynamic port from environment or default to 3000
  const port = parseInt(process.env.PORT || '3000');
  await app.listen(port);

  console.log(`✅ Nest application successfully started on port ${port}`);
  console.log(`🌐 API available at: http://localhost:${port}/api`);
  console.log(`📚 Swagger docs at: http://localhost:${port}/api-docs`);
}

void bootstrap();
