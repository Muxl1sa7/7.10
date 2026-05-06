import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGroupDto {
  @ApiProperty({ example: 'Matematika' })
  @IsString()
  @IsNotEmpty()
  direction: string;

  @ApiProperty({ example: 'DU-CHOR-JUMA', description: 'Dars kunlari' })
  @IsString()
  @IsNotEmpty()
  lessonDays: string;

  @ApiProperty({ example: '14:00-16:00' })
  @IsString()
  @IsNotEmpty()
  lessonTime: string;

  @ApiPropertyOptional({ example: 'uuid-of-teacher' })
  @IsUUID()
  @IsOptional()
  teacherId?: string;
}

export class UpdateGroupDto {
  @ApiPropertyOptional({ example: 'Informatika' })
  @IsString()
  @IsOptional()
  direction?: string;

  @ApiPropertyOptional({ example: 'SE-PA-SHA' })
  @IsString()
  @IsOptional()
  lessonDays?: string;

  @ApiPropertyOptional({ example: '11:00-13:00' })
  @IsString()
  @IsOptional()
  lessonTime?: string;

  @ApiPropertyOptional({ example: 'uuid-of-teacher' })
  @IsUUID()
  @IsOptional()
  teacherId?: string;
}

export class GroupFilterDto {
  @ApiPropertyOptional({ example: 'Matematika', description: 'Nom yoki yo\'nalish bo\'yicha qidiruv' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 'Matematika' })
  @IsString()
  @IsOptional()
  direction?: string;

  @ApiPropertyOptional({ example: 'uuid-of-teacher' })
  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}

export class AddStudentToGroupDto {
  @ApiProperty({ example: 'uuid-of-student' })
  @IsUUID()
  studentId: string;
}
