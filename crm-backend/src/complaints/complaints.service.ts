import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint } from './complaint.entity';
import { CreateComplaintDto, ComplaintFilterDto } from './dto/complaint.dto';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private complaintRepo: Repository<Complaint>,
  ) {}

  async create(dto: CreateComplaintDto) {
    const complaint = this.complaintRepo.create(dto);
    return this.complaintRepo.save(complaint);
  }

  // Kunlik guruhlangan ro'yxat — QueryBuilder
  async findAll(filter: ComplaintFilterDto) {
    const { date, dateFrom, dateTo, search, page = 1, limit = 10 } = filter;

    const qb = this.complaintRepo.createQueryBuilder('complaint');

    if (date) {
      qb.andWhere(`DATE(complaint.createdAt) = :date`, { date });
    } else {
      if (dateFrom) qb.andWhere(`DATE(complaint.createdAt) >= :dateFrom`, { dateFrom });
      if (dateTo) qb.andWhere(`DATE(complaint.createdAt) <= :dateTo`, { dateTo });
    }

    if (search) {
      qb.andWhere(
        '(complaint.studentName ILIKE :search OR complaint.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await qb.getCount();
    const items = await qb
      .orderBy('complaint.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Kunlar bo'yicha guruhlash (frontend uchun)
    const grouped: Record<string, typeof items> = {};
    for (const item of items) {
      const dayKey = new Date(item.createdAt).toISOString().split('T')[0];
      if (!grouped[dayKey]) grouped[dayKey] = [];
      grouped[dayKey].push(item);
    }

    const groupedList = Object.entries(grouped).map(([date, complaints]) => ({
      date,
      complaints,
    }));

    return {
      data: groupedList,
      flat: items,
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
    const complaint = await this.complaintRepo.findOne({ where: { id } });
    if (!complaint) throw new NotFoundException('Murojat topilmadi');
    await this.complaintRepo.remove(complaint);
    return { message: 'Murojat o\'chirildi', id };
  }

  async getTodayCount() {
    return this.complaintRepo
      .createQueryBuilder('complaint')
      .where(`DATE(complaint.createdAt) = CURRENT_DATE`)
      .getCount();
  }
}
