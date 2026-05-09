import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Group } from '../groups/group.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column()
  @ApiProperty({ example: 'Muxamadaliyev Ibrohim' })
  fullName: string;

  @Column()
  @ApiProperty({ example: '+998901234567' })
  phone: string;

  @Column()
  @ApiProperty({ example: 'Matematika' })
  direction: string;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  parentName: string;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  parentPhone: string;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  photo: string;

  @Column({ default: true })
  @ApiProperty()
  isActive: boolean;

  // forwardRef — circular dependency hal qiladi
  @ManyToMany(() => Group, (group) => group.students)
  groups: Group[];

  @DeleteDateColumn()
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
