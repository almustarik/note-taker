import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import helmet from 'helmet';
import { MongoExceptionFilter } from './common/mongo-exception.filter.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' });
  app.setGlobalPrefix('api', { exclude: ['docs', 'docs/swagger', 'health'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new MongoExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Secure Notes API')
    .setDescription('Secure Note-Taking REST API with JWT Auth, Role-Based Access Control, and Aggregations')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs/swagger', app, document);
  app.use('/docs', apiReference({ spec: { content: document } }));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
