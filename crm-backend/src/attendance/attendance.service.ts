import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './attendance.entity';
import { BulkAttendanceDto, AttendanceFilterDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
  ) {}

  // Guruh davomati saqlash — bulk upsert
  async saveBulk(dto: BulkAttendanceDto) {
    const { groupId, date, records } = dto;

    const upsertData = records.map((r) => ({
      studentId: r.studentId,
      groupId,
      date,
      present: r.present,
    }));

    // Upsert — mavjud bo'lsa yangilaydi, bo'lmasa yaratadi
    await this.attendanceRepo
      .createQueryBuilder()
      .insert()
      .into(Attendance)
      .values(upsertData)
      .orUpdate(['present'], ['studentId', 'groupId', 'date'])
      .execute();

    return {
      message: `${records.length} ta o'quvchi davomati saqlandi`,
      date,
      groupId,
    };
  }

  // Davomat ro'yxati — QueryBuilder + filter + pagination
  async findAll(filter: AttendanceFilterDto) {
    const { groupId, studentId, date, dateFrom, dateTo, absentOnly, page = 1, limit = 20 } = filter;

    const qb = this.attendanceRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.student', 'student')
      .leftJoinAndSelect('att.group', 'group');

    if (groupId) qb.andWhere('att.groupId = :groupId', { groupId });
    if (studentId) qb.andWhere('att.studentId = :studentId', { studentId });
    if (date) qb.andWhere('att.date = :date', { date });
    if (dateFrom) qb.andWhere('att.date >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('att.date <= :dateTo', { dateTo });
    if (absentOnly) qb.andWhere('att.present = false');

    const total = await qb.getCount();
    const data = await qb
      .orderBy('att.date', 'DESC')
      .addOrderBy('student.fullName', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    };
  }

  // Bitta kun — guruhning barchasi
  async getByGroupAndDate(groupId: string, date: string) {
    return this.attendanceRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.student', 'student')
      .where('att.groupId = :groupId', { groupId })
      .andWhere('att.date = :date', { date })
      .orderBy('student.fullName', 'ASC')
      .getMany();
  }

  // Kelmagan o'quvchilar — sana bo'yicha
  async getAbsentByDate(groupId: string, date: string) {
    return this.attendanceRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.student', 'student')
      .where('att.groupId = :groupId', { groupId })
      .andWhere('att.date = :date', { date })
      .andWhere('att.present = false')
      .orderBy('student.fullName', 'ASC')
      .getMany();
  }

  // O'quvchining davomat foizi
  async getStudentAttendanceRate(studentId: string, groupId: string) {
    const total = await this.attendanceRepo
      .createQueryBuilder('att')
      .where('att.studentId = :studentId', { studentId })
      .andWhere('att.groupId = :groupId', { groupId })
      .getCount();

    const present = await this.attendanceRepo
      .createQueryBuilder('att')
      .where('att.studentId = :studentId', { studentId })
      .andWhere('att.groupId = :groupId', { groupId })
      .andWhere('att.present = true')
      .getCount();

    return {
      total,
      present,
      absent: total - present,
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }

  // Oylik davomat statistikasi — dashboard uchun
  async getMonthlyStats(year: number) {
    const result = await this.attendanceRepo
      .createQueryBuilder('att')
      .select(`EXTRACT(MONTH FROM att.date::date)`, 'month')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN att.present = true THEN 1 ELSE 0 END)', 'present')
      .where(`EXTRACT(YEAR FROM att.date::date) = :year`, { year })
      .groupBy(`EXTRACT(MONTH FROM att.date::date)`)
      .orderBy('month', 'ASC')
      .getRawMany();

    return result;
  }
}
