import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { Group } from './group.entity';
import { Student } from '../students/student.entity';
import { Payment } from '../payments/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Group, Student, Payment])],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService, TypeOrmModule],
})
export class GroupsModule {}
