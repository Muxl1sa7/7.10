import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../students/student.entity';
import { Group } from '../groups/group.entity';
import { Payment } from '../payments/payment.entity';
import { Attendance } from '../attendance/attendance.entity';
import { Complaint } from '../complaints/complaint.entity';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Group)
    private groupRepo: Repository<Group>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    @InjectRepository(Complaint)
    private complaintRepo: Repository<Complaint>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // Asosiy statistika — dashboard kartochkalari uchun
  async getStats() {
    // Jami o'quvchilar
    const totalStudents = await this.studentRepo
      .createQueryBuilder('s')
      .where('s.isActive = true')
      .getCount();

    // O'qituvchilar soni
    const totalTeachers = await this.userRepo
      .createQueryBuilder('u')
      .where('u.role = :role', { role: UserRole.TEACHER })
      .andWhere('u.isActive = true')
      .getCount();

    // Jami guruhlar
    const totalGroups = await this.groupRepo
      .createQueryBuilder('g')
      .where('g.isActive = true')
      .getCount();

    // Shu oy tark etganlar
    const leftThisMonth = await this.studentRepo
      .createQueryBuilder('s')
      .where('s.isActive = false')
      .andWhere(`DATE_TRUNC('month', s.updatedAt) = DATE_TRUNC('month', NOW())`)
      .getCount();

    // Shu oylik murojatlar
    const complaintsToday = await this.complaintRepo
      .createQueryBuilder('c')
      .where(`DATE(c.createdAt) = CURRENT_DATE`)
      .getCount();

    // Shu oy to'lovlar summasi
    const paymentResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('SUM(p.amount)', 'total')
      .where(`DATE_TRUNC('month', p.paymentDate::date) = DATE_TRUNC('month', NOW())`)
      .getRawOne();

    return {
      totalStudents,
      totalTeachers,
      totalGroups,
      leftThisMonth,
      complaintsToday,
      thisMonthPayments: Number(paymentResult?.total || 0),
    };
  }

  // Oylik statistika — grafik uchun (yil bo'yicha)
  async getMonthlyStats(year: number) {
    // Har oy o'quvchilar soni
    const studentsByMonth = await this.studentRepo
      .createQueryBuilder('s')
      .select(`EXTRACT(MONTH FROM s.createdAt)`, 'month')
      .addSelect('COUNT(s.id)', 'count')
      .where(`EXTRACT(YEAR FROM s.createdAt) = :year`, { year })
      .andWhere('s.isActive = true')
      .groupBy(`EXTRACT(MONTH FROM s.createdAt)`)
      .orderBy('month', 'ASC')
      .getRawMany();

    // Har oy tark etganlar
    const leftByMonth = await this.studentRepo
      .createQueryBuilder('s')
      .select(`EXTRACT(MONTH FROM s.updatedAt)`, 'month')
      .addSelect('COUNT(s.id)', 'count')
      .where(`EXTRACT(YEAR FROM s.updatedAt) = :year`, { year })
      .andWhere('s.isActive = false')
      .groupBy(`EXTRACT(MONTH FROM s.updatedAt)`)
      .orderBy('month', 'ASC')
      .getRawMany();

    // Har oy to'lovlar
    const paymentsByMonth = await this.paymentRepo
      .createQueryBuilder('p')
      .select(`EXTRACT(MONTH FROM p.paymentDate::date)`, 'month')
      .addSelect('SUM(p.amount)', 'total')
      .addSelect('COUNT(p.id)', 'count')
      .where(`EXTRACT(YEAR FROM p.paymentDate::date) = :year`, { year })
      .groupBy(`EXTRACT(MONTH FROM p.paymentDate::date)`)
      .orderBy('month', 'ASC')
      .getRawMany();

    // 12 oylik ma'lumot birlashtirish
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const students = studentsByMonth.find((s) => Number(s.month) === month);
      const left = leftByMonth.find((l) => Number(l.month) === month);
      const payments = paymentsByMonth.find((p) => Number(p.month) === month);

      return {
        month,
        monthName: new Date(year, i, 1).toLocaleString('uz', { month: 'long' }),
        students: Number(students?.count || 0),
        leftStudents: Number(left?.count || 0),
        paymentsTotal: Number(payments?.total || 0),
        paymentsCount: Number(payments?.count || 0),
      };
    });

    return { year, months };
  }

  // Top yo'nalishlar
  async getTopDirections() {
    return this.studentRepo
      .createQueryBuilder('s')
      .select('s.direction', 'direction')
      .addSelect('COUNT(s.id)', 'count')
      .where('s.isActive = true')
      .groupBy('s.direction')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();
  }
}
