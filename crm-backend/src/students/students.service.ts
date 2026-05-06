import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { Payment } from '../payments/payment.entity';
import { CreateStudentDto, UpdateStudentDto, StudentFilterDto } from './dto/student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  async create(dto: CreateStudentDto, photoPath?: string) {
    const exists = await this.studentRepo.findOne({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('Bu telefon raqam allaqachon ro\'yxatda mavjud');
    const student = this.studentRepo.create({ ...dto, photo: photoPath || null });
    return this.studentRepo.save(student);
  }

  async findAll(filter: StudentFilterDto) {
    const { search, direction, isActive, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = filter;
    const allowedSort = ['fullName', 'createdAt', 'direction', 'phone'];
    const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'createdAt';

    const qb = this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.groups', 'group')
      .leftJoinAndSelect('group.teacher', 'teacher');

    if (search) {
      qb.andWhere(
        '(student.fullName ILIKE :s OR student.phone ILIKE :s OR student.parentName ILIKE :s)',
        { s: `%${search}%` },
      );
    }
    if (direction) qb.andWhere('student.direction = :direction', { direction });
    if (isActive !== undefined) qb.andWhere('student.isActive = :isActive', { isActive });

    const total = await qb.getCount();
    const data = await qb
      .orderBy(`student.${safeSortBy}`, sortOrder)
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

  // Bitta o'quvchi — guruhlar + to'lov tarixi bilan
  async findOne(id: string) {
    const student = await this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.groups', 'group')
      .leftJoinAndSelect('group.teacher', 'teacher')
      .where('student.id = :id', { id })
      .getOne();

    if (!student) throw new NotFoundException('O\'quvchi topilmadi');

    // To'lov tarixi — oxirgi 6 oy
    const payments = await this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.group', 'group')
      .where('payment.studentId = :id', { id })
      .orderBy('payment.paymentDate', 'DESC')
      .take(20)
      .getMany();

    return { ...student, payments };
  }

  async update(id: string, dto: UpdateStudentDto, photoPath?: string) {
    const student = await this.studentRepo
      .createQueryBuilder('student')
      .where('student.id = :id', { id })
      .getOne();
    if (!student) throw new NotFoundException('O\'quvchi topilmadi');

    if (dto.phone && dto.phone !== student.phone) {
      const exists = await this.studentRepo.findOne({ where: { phone: dto.phone } });
      if (exists) throw new ConflictException('Bu telefon raqam allaqachon mavjud');
    }

    Object.assign(student, dto);
    if (photoPath) student.photo = photoPath;
    return this.studentRepo.save(student);
  }

  async remove(id: string) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) throw new NotFoundException('O\'quvchi topilmadi');
    student.isActive = false;
    await this.studentRepo.save(student);
    return { message: 'O\'quvchi o\'chirildi', id };
  }

  async hardDelete(id: string) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) throw new NotFoundException('O\'quvchi topilmadi');
    await this.studentRepo.remove(student);
    return { message: 'O\'quvchi to\'liq o\'chirildi', id };
  }

  async getDirections() {
    const result = await this.studentRepo
      .createQueryBuilder('student')
      .select('DISTINCT student.direction', 'direction')
      .where('student.isActive = true')
      .orderBy('student.direction', 'ASC')
      .getRawMany();
    return result.map((r) => r.direction);
  }

  async getStats() {
    const total = await this.studentRepo.createQueryBuilder('s').getCount();
    const active = await this.studentRepo.createQueryBuilder('s').where('s.isActive = true').getCount();
    const thisMonth = await this.studentRepo
      .createQueryBuilder('s')
      .where('s.isActive = true')
      .andWhere(`DATE_TRUNC('month', s.createdAt) = DATE_TRUNC('month', NOW())`)
      .getCount();
    const leftThisMonth = await this.studentRepo
      .createQueryBuilder('s')
      .where('s.isActive = false')
      .andWhere(`DATE_TRUNC('month', s.updatedAt) = DATE_TRUNC('month', NOW())`)
      .getCount();
    return { total, active, inactive: total - active, thisMonth, leftThisMonth };
  }
}
