import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  GITHUB = 'github',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column()
  @ApiProperty({ example: 'Muxamadaliyev Ibrohim' })
  fullName: string;

  @Column({ unique: true, nullable: true })
  @ApiProperty({ example: '+998901234567', required: false })
  phone: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ nullable: true, unique: true })
  @ApiProperty({ required: false })
  email: string;

  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ nullable: true, unique: true })
  githubId: string;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  @ApiProperty({ enum: AuthProvider })
  provider: AuthProvider;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ADMIN,
  })
  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  photo: string;

  @Column({ default: true })
  @ApiProperty()
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
