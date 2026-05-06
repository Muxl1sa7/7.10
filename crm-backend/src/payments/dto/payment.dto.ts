import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @ApiProperty({ example: 'uuid-of-student' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 'uuid-of-group' })
  @IsUUID()
  groupId: string;

  @ApiPropertyOptional({ example: 500000, description: 'To\'lov miqdori (so\'m)' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  amount?: number;

  @ApiProperty({ example: '2022-03-05', description: 'To\'lov sanasi (YYYY-MM-DD)' })
  @IsDateString()
  paymentDate: string;

  @ApiPropertyOptional({ example: 'Mart oyi to\'lovi' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class PaymentFilterDto {
  @ApiPropertyOptional({ example: 'uuid-of-student' })
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-group' })
  @IsUUID()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-teacher' })
  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @ApiPropertyOptional({ example: '2022-03-01', description: 'Boshlanish sanasi' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2022-03-31', description: 'Tugash sanasi' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Shu oy bo\'yicha filter', example: true })
  @IsOptional()
  @Type(() => Boolean)
  thisMonth?: boolean;

  @ApiPropertyOptional({ example: 'Ibrohim', description: 'O\'quvchi ismi bo\'yicha qidiruv' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
