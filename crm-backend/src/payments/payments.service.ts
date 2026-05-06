import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { CreatePaymentDto, PaymentFilterDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  async create(dto: CreatePaymentDto, teacherId?: string) {
    const payment = this.paymentRepo.create({ ...dto, teacherId });
    return this.paymentRepo.save(payment);
  }

  async findAll(filter: PaymentFilterDto) {
    const { studentId, groupId, teacherId, dateFrom, dateTo, thisMonth, search, page = 1, limit = 10 } = filter;

    const qb = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.student', 'student')
      .leftJoinAndSelect('payment.group', 'group')
      .leftJoinAndSelect('payment.teacher', 'teacher');

    if (studentId) qb.andWhere('payment.studentId = :studentId', { studentId });
    if (groupId) qb.andWhere('payment.groupId = :groupId', { groupId });
    if (teacherId) qb.andWhere('payment.teacherId = :teacherId', { teacherId });

    if (thisMonth) {
      qb.andWhere(`DATE_TRUNC('month', payment.paymentDate::date) = DATE_TRUNC('month', NOW())`);
    } else {
      if (dateFrom) qb.andWhere('payment.paymentDate >= :dateFrom', { dateFrom });
      if (dateTo) qb.andWhere('payment.paymentDate <= :dateTo', { dateTo });
    }

    if (search) {
      qb.andWhere('student.fullName ILIKE :search', { search: `%${search}%` });
    }

    const total = await qb.getCount();
    const data = await qb
      .orderBy('payment.paymentDate', 'DESC')
      .addOrderBy('payment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async remove(id: string) {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('To\'lov topilmadi');
    await this.paymentRepo.remove(payment);
    return { message: 'To\'lov o\'chirildi', id };
  }

  // Guruhda shu oy to'lov qilmaganlar
  async getUnpaidStudents(groupId: string) {
    const result = await this.paymentRepo
      .createQueryBuilder('payment')
      .select('payment.studentId')
      .where('payment.groupId = :groupId', { groupId })
      .andWhere(`DATE_TRUNC('month', payment.paymentDate::date) = DATE_TRUNC('month', NOW())`)
      .getRawMany();

    return result.map((r) => r.payment_studentId);
  }

  // Oylik to'lovlar summasi — dashboard uchun
  async getMonthlySummary(year: number) {
    const result = await this.paymentRepo
      .createQueryBuilder('payment')
      .select(`EXTRACT(MONTH FROM payment.paymentDate::date)`, 'month')
      .addSelect('SUM(payment.amount)', 'total')
      .addSelect('COUNT(payment.id)', 'count')
      .where(`EXTRACT(YEAR FROM payment.paymentDate::date) = :year`, { year })
      .groupBy(`EXTRACT(MONTH FROM payment.paymentDate::date)`)
      .orderBy('month', 'ASC')
      .getRawMany();

    return result;
  }
}
