import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('complaints')
export class Complaint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @ApiProperty({ example: 'Muxamadaliyev Ibrohim' })
  studentName: string;

  @Column()
  @ApiProperty({ example: '+998901234567' })
  phone: string;

  @Column({ type: 'text' })
  @ApiProperty({ example: 'Lorem ipsum...' })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
