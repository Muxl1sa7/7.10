import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const logger = new Logger('Bootstrap');

function ensureUploadDirs() {
  const dirs = ['uploads', 'uploads/students', 'uploads/groups'];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      logger.log(`Papka yaratildi: ${dir}`);
    }
  }
}

async function bootstrap() {
  ensureUploadDirs();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global xato filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global response wrapper
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Statik fayllar
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle("O'quv Markazi CRM API")
    .setDescription(`
## O'quv markazi boshqaruv tizimi

### Rollar:
| Rol | Vakolat |
|-----|---------|
| **SUPERADMIN** | Admin/Teacher yaratish, barcha operatsiyalar |
| **ADMIN** | O'quvchi, guruh, to'lov, davomat, murojat |
| **TEACHER** | Faqat o'z guruhi: davomat, ro'yxat |

### Javob formati:
\`\`\`json
// Muvaffaqiyat:
{ "success": true, "data": {...}, "timestamp": "..." }
// Xato:
{ "success": false, "statusCode": 400, "message": "...", "error": "..." }
\`\`\`

### Kirish:
1. \`POST /api/auth/login\` → token oling
2. **Authorize** tugmasini bosib token kiriting
    `)
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT-auth',
    )
    .addTag('Auth', 'Kirish va foydalanuvchi boshqaruvi')
    .addTag('Students', "O'quvchilar")
    .addTag('Groups', 'Guruhlar')
    .addTag('Payments', "To'lovlar")
    .addTag('Attendance', 'Davomat')
    .addTag('Complaints', 'Murojatlar')
    .addTag('Dashboard', 'Statistika')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha', docExpansion: 'none' },
    customSiteTitle: 'CRM API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Server: http://localhost:${port}/api`);
  logger.log(`📚 Swagger: http://localhost:${port}/api/docs`);
  logger.log(`🌍 Mode: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
