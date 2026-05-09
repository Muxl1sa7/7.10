import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';
import { Student } from '../students/student.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column()
  @ApiProperty({ example: 'Matematika' })
  direction: string;

  @Column()
  @ApiProperty({ example: 'DU-CHOR-JUMA' })
  lessonDays: string;

  @Column()
  @ApiProperty({ example: '14:00-16:00' })
  lessonTime: string;

  @ManyToOne(() => User, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @Column({ nullable: true })
  teacherId: string;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  teacherPhoto: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Student, (student) => student.groups, { cascade: false })
  @JoinTable({
    name: 'group_students',
    joinColumn: { name: 'groupId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'studentId', referencedColumnName: 'id' },
  })
  students: Student[];

  @DeleteDateColumn()
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
