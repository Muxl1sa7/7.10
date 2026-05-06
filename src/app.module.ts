import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { GroupsModule } from './groups/groups.module';
import { PaymentsModule } from './payments/payments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DB_HOST', 'localhost'),
        port: cfg.get<number>('DB_PORT', 5432),
        username: cfg.get('DB_USERNAME', 'postgres'),
        password: cfg.get('DB_PASSWORD', 'password'),
        database: cfg.get('DB_DATABASE', 'crm_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize:false,
        logging: cfg.get('NODE_ENV') === 'development',
        extra: { max: 10, connectionTimeoutMillis: 3000 },
      }),
      inject: [ConfigService],
    }),

    // Rate limiting — brute force himoya
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,   // 1 daqiqa
        limit: 30,    // 30 ta request
      },
      {
        name: 'long',
        ttl: 3600000, // 1 soat
        limit: 500,
      },
    ]),

    AuthModule,
    UsersModule,
    StudentsModule,
    GroupsModule,
    PaymentsModule,
    AttendanceModule,
    ComplaintsModule,
    DashboardModule,
  ],
  providers: [
    // Global rate limit guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
