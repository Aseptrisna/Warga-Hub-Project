import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files (uploads)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Security
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images to be loaded
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('WargaHub API')
    .setDescription('Platform Digital RT/RW/Desa - API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('citizens', 'Citizens management')
    .addTag('families', 'Families management')
    .addTag('letters', 'Letters workflow')
    .addTag('payments', 'Finance & payments')
    .addTag('patrol', 'Security patrol')
    .addTag('announcements', 'Announcements')
    .addTag('reports', 'Reports & guestbook')
    .addTag('events', 'Events & activities')
    .addTag('panic', 'Panic button')
    .addTag('dashboard', 'Dashboard & statistics')
    .addTag('settings', 'Settings & configuration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`\n🚀 WargaHub Backend API running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs\n`);
}

bootstrap();
