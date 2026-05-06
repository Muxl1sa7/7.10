import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../students/student.entity';
import { Group } from '../groups/group.entity';
import { User } from '../users/user.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @ManyToOne(() => Student, { eager: false })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @ManyToOne(() => Group, { eager: false })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column()
  groupId: string;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @Column({ nullable: true })
  teacherId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  @ApiProperty({ example: 500000 })
  amount: number;

  @Column({ type: 'date' })
  @ApiProperty({ example: '2022-03-05' })
  paymentDate: string;

  @Column({ nullable: true })
  @ApiProperty({ example: 'Izoh', required: false })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}
