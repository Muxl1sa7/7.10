import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, MinLength,
  IsEnum, IsOptional, Matches,
} from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class LoginDto {
  @ApiProperty({ example: '+998901234567', description: 'Telefon raqam (+998XXXXXXXXX)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+998[0-9]{9}$/, { message: 'Telefon raqam +998XXXXXXXXX formatida bo\'lishi kerak' })
  phone: string;

  @ApiProperty({ example: 'password123', description: 'Kamida 6 belgi' })
  @IsString()
  @MinLength(6, { message: 'Parol kamida 6 belgi bo\'lishi kerak' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class CreateAdminDto {
  @ApiProperty({ example: 'Muxamadaliyev Ibrohim' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+998[0-9]{9}$/, { message: 'Telefon raqam +998XXXXXXXXX formatida bo\'lishi kerak' })
  phone: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6, { message: 'Parol kamida 6 belgi bo\'lishi kerak' })
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

  @ApiPropertyOptional({ example: 'yangiparol123' })
  @IsString()
  @MinLength(6)
  @IsOptional()
  newPassword?: string;

  @ApiPropertyOptional({ example: 'hozirgiparol123' })
  @IsString()
  @IsOptional()
  currentPassword?: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGci...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGci...' })
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    fullName: string;
    phone: string;
    role: string;
  };
}
