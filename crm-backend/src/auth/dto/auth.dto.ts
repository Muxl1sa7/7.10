import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class LoginDto {
  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class CreateAdminDto {
  @ApiProperty({ example: 'Muxamadaliyev Ibrohim' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: [UserRole.ADMIN, UserRole.TEACHER], example: UserRole.ADMIN })
  @IsEnum([UserRole.ADMIN, UserRole.TEACHER])
  role: UserRole.ADMIN | UserRole.TEACHER;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Yangi Ism Familiya' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: 'yangiparol123', description: 'Kamida 6 belgi' })
  @IsString()
  @MinLength(6)
  @IsOptional()
  newPassword?: string;

  @ApiPropertyOptional({ example: 'hozirgiparol123', description: 'Parol o\'zgartirish uchun majburiy' })
  @IsString()
  @IsOptional()
  currentPassword?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Yangi Ism' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: 'yangiparol123' })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isActive?: boolean;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token: string;

  @ApiProperty()
  user: {
    id: string;
    fullName: string;
    phone: string;
    role: string;
  };
}
