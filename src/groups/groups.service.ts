import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './group.entity';
import { Student } from '../students/student.entity';
import { Payment } from '../payments/payment.entity';
import { CreateGroupDto, UpdateGroupDto, GroupFilterDto } from './dto/group.dto';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepo: Repository<Group>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  async create(dto: CreateGroupDto, teacherPhotoPath?: string) {
    const group = this.groupRepo.create({ ...dto, teacherPhoto: teacherPhotoPath || null });
    return this.groupRepo.save(group);
  }

  // TEACHER faqat o'z guruhlarini ko'radi
  async findAll(filter: GroupFilterDto, currentUser?: User) {
    const { search, direction, teacherId, page = 1, limit = 10 } = filter;

    const qb = this.groupRepo
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.teacher', 'teacher')
      .loadRelationCountAndMap('group.studentCount', 'group.students', 'gs',
        (qb) => qb.where('gs.isActive = true'),
      )
      .where('group.isActive = true');

    // TEACHER cheklov — faqat o'z guruhi
    if (currentUser?.role === UserRole.TEACHER) {
      qb.andWhere('group.teacherId = :tid', { tid: currentUser.id });
    } else {
      if (teacherId) qb.andWhere('group.teacherId = :teacherId', { teacherId });
    }

    if (search) {
      qb.andWhere(
        '(group.direction ILIKE :s OR group.lessonDays ILIKE :s)',
        { s: `%${search}%` },
      );
    }
    if (direction) qb.andWhere('group.direction = :direction', { direction });

    const total = await qb.getCount();
    const data = await qb
      .orderBy('group.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    };
  }

  async findOne(id: string, currentUser?: User) {
    const group = await this.groupRepo
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.teacher', 'teacher')
      .leftJoinAndSelect('group.students', 'student')
      .where('group.id = :id', { id })
      .andWhere('group.isActive = true')
      .orderBy('student.fullName', 'ASC')
      .getOne();

    if (!group) throw new NotFoundException('Guruh topilmadi');

    // TEACHER faqat o'z guruhini ko'ra oladi
    if (currentUser?.role === UserRole.TEACHER && group.teacherId !== currentUser.id) {
      throw new ForbiddenException('Bu guruhga ruxsatingiz yo\'q');
    }
    return group;
  }

  // Guruh o'quvchilari + shu oy to'lov holati
  async getGroupStudentsWithPayment(groupId: string, currentUser?: User) {
    await this.findOne(groupId, currentUser);

    const students = await this.studentRepo
      .createQueryBuilder('student')
      .innerJoin('student.groups', 'group', 'group.id = :groupId', { groupId })
      .where('student.isActive = true')
      .orderBy('student.fullName', 'ASC')
      .getMany();

    // Shu oy to'lov qilganlar ID lari
    const paidIds = await this.paymentRepo
      .createQueryBuilder('payment')
      .select('payment.studentId', 'studentId')
      .where('payment.groupId = :groupId', { groupId })
      .andWhere(`DATE_TRUNC('month', payment.paymentDate::date) = DATE_TRUNC('month', NOW())`)
      .getRawMany();

    const paidSet = new Set(paidIds.map((p) => p.studentId));

    return students.map((s) => ({
      ...s,
      paidThisMonth: paidSet.has(s.id),
    }));
  }

  async update(id: string, dto: UpdateGroupDto, teacherPhotoPath?: string, currentUser?: User) {
    const group = await this.findOne(id, currentUser);
    Object.assign(group, dto);
    if (teacherPhotoPath) group.teacherPhoto = teacherPhotoPath;
    return this.groupRepo.save(group);
  }

  async remove(id: string) {
    const group = await this.findOne(id);
    group.isActive = false;
    await this.groupRepo.save(group);
    return { message: 'Guruh o\'chirildi', id };
  }

  async addStudent(groupId: string, studentId: string) {
    const group = await this.findOne(groupId);
    const student = await this.studentRepo.findOne({ where: { id: studentId, isActive: true } });
    if (!student) throw new NotFoundException('O\'quvchi topilmadi');

    const already = await this.groupRepo
      .createQueryBuilder('group')
      .innerJoin('group.students', 'student', 'student.id = :studentId', { studentId })
      .where('group.id = :groupId', { groupId })
      .getOne();
    if (already) throw new ConflictException('O\'quvchi bu guruhda allaqachon mavjud');

    group.students = [...(group.students || []), student];
    await this.groupRepo.save(group);
    return { message: 'O\'quvchi guruhga qo\'shildi' };
  }

  async removeStudent(groupId: string, studentId: string) {
    const group = await this.findOne(groupId);
    group.students = (group.students || []).filter((s) => s.id !== studentId);
    await this.groupRepo.save(group);
    return { message: 'O\'quvchi guruhdan chiqarildi' };
  }
}
