import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { configureApp } from './setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger UI needs inline scripts, so only /docs gets a relaxed CSP; the API keeps the strict defaults
  const apiHeaders = helmet();
  const docsHeaders = helmet({ contentSecurityPolicy: false });
  app.use((req: Request, res: Response, next: NextFunction) =>
    (req.path.startsWith('/docs') ? docsHeaders : apiHeaders)(req, res, next),
  );

  const frontendUrl = process.env.FRONTEND_URL;
  app.enableCors({
    origin: frontendUrl ? (frontendUrl === '*' ? true : frontendUrl.split(',').map((s) => s.trim())) : true,
    credentials: true,
  });
  configureApp(app);

  const config = new DocumentBuilder()
    .setTitle('Notes API')
    .setDescription('Log in with POST /api/auth/login, then click Authorize and paste the token.')
    .setVersion('1.0')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config), {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

bootstrap();
