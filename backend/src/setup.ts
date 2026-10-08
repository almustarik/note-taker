import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongoExceptionFilter } from './common/mongo-exception.filter.js';

// shared by main.ts and the e2e tests, so tests run against the same setup as production
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new MongoExceptionFilter());
  return app;
}
