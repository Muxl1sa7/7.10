import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { Student } from './student.entity';
import { Payment } from '../payments/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Payment]),
    MulterModule.register({ dest: './uploads/students' }),
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService, TypeOrmModule],
})
export class StudentsModule {}
