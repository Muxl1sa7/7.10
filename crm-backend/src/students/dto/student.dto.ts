import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumberString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateStudentDto {
  @ApiProperty({ example: 'Muxamadaliyev Ibrohim' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Matematika' })
  @IsString()
  @IsNotEmpty()
  direction: string;

  @ApiPropertyOptional({ example: 'Karimov Sardor' })
  @IsString()
  @IsOptional()
  parentName?: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsString()
  @IsOptional()
  parentPhone?: string;
}

export class UpdateStudentDto {
  @ApiPropertyOptional({ example: 'Muxamadaliyev Ibrohim' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Matematika' })
  @IsString()
  @IsOptional()
  direction?: string;

  @ApiPropertyOptional({ example: 'Karimov Sardor' })
  @IsString()
  @IsOptional()
  parentName?: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsString()
  @IsOptional()
  parentPhone?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}

export class StudentFilterDto {
  @ApiPropertyOptional({
    example: 'Ibrohim',
    description: 'Ism yoki telefon raqam bo\'yicha qidiruv',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 'Matematika', description: 'Yo\'nalish bo\'yicha filter' })
  @IsString()
  @IsOptional()
  direction?: string;

  @ApiPropertyOptional({ example: true, description: 'Aktiv/Naktiv filter' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Sahifa raqami', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Har sahifada nechta', default: 10 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Saralash maydoni',
    enum: ['fullName', 'createdAt', 'direction'],
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
