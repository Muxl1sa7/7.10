import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Student } from '../students/student.entity';
import { Group } from '../groups/group.entity';
import { Payment } from '../payments/payment.entity';
import { Attendance } from '../attendance/attendance.entity';
import { Complaint } from '../complaints/complaint.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Group, Payment, Attendance, Complaint, User])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
