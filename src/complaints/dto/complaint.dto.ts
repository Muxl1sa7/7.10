import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateComplaintDto {
  @ApiProperty({ example: 'Muxamadaliyev Ibrohim' })
  @IsString()
  @IsNotEmpty()
  studentName: string;

  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Dars vaqtida muammo bor edi...' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class ComplaintFilterDto {
  @ApiPropertyOptional({ example: '2022-03-27', description: 'Aniq sana bo\'yicha filter' })
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

  @ApiPropertyOptional({ example: 'Ibrohim', description: 'Ism yoki telefon bo\'yicha qidiruv' })
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
