import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../students/student.entity';
import { Group } from '../groups/group.entity';

@Entity('attendances')
@Unique(['studentId', 'groupId', 'date'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
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

  @Column({ type: 'date' })
  @ApiProperty({ example: '2022-03-07' })
  date: string;

  @Column({ default: true })
  @ApiProperty({ example: true, description: 'true = keldi, false = kelmadi' })
  present: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
