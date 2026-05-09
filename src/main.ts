import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { winstonLogger } from './common/logger/winston.logger';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

function ensureDirs() {
  const dirs = ['uploads', 'uploads/students', 'uploads/groups', 'logs'];
  for (const dir of dirs) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
}

async function bootstrap() {
  ensureDirs();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({ instance: winstonLogger }),
  });

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

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

### Kirish:
1. \`POST /api/auth/login\` → accessToken va refreshToken oling
2. **Authorize** tugmasini bosib accessToken kiriting

### Token yangilash:
- accessToken muddati tugasa: \`POST /api/auth/refresh\` ga refreshToken yuboring
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

  winstonLogger.info(`🚀 Server: http://localhost:${port}/api`);
  winstonLogger.info(`📚 Swagger: http://localhost:${port}/api/docs`);
  winstonLogger.info(`🌍 Mode: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
