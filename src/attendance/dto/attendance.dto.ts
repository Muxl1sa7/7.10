import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsDateString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class AttendanceRecordDto {
  @ApiProperty({ example: 'uuid-of-student' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: true, description: 'true = keldi, false = kelmadi' })
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  present: boolean;
}

export class BulkAttendanceDto {
  @ApiProperty({ example: 'uuid-of-group' })
  @IsUUID()
  groupId: string;

  @ApiProperty({ example: '2022-03-07', description: 'Davomat sanasi (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ type: [AttendanceRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}

export class AttendanceFilterDto {
  @ApiPropertyOptional({ example: 'uuid-of-group' })
  @IsUUID()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-student' })
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({ example: '2022-03-07' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ example: '2022-03-01' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2022-03-31' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ example: false, description: 'Faqat kelmagan o\'quvchilar' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  absentOnly?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
