import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { MongoExceptionFilter } from './common/mongo-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new MongoExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
