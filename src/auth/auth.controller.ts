import {
  Controller, Post, Get, Patch,
  Body, Param, UseGuards,
  UseInterceptors, UploadedFile, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, CreateAdminDto, UpdateProfileDto, LoginResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GoogleAuthGuard } from '../common/guards/google-auth.guard';
import { GithubAuthGuard } from '../common/guards/github-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { Throttle } from '@nestjs/throttler';

const photoStorage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, `user-${Date.now()}${extname(file.originalname)}`);
  },
});

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── LOCAL LOGIN ──────────────────────────────────────────
  @Post('login')
  @Public()
  @Throttle({ short: { limit: 10, ttl: 300000 } })
  @ApiOperation({ summary: 'Tizimga kirish (telefon + parol)' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Noto\'g\'ri login yoki parol' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ─── GOOGLE OAUTH ─────────────────────────────────────────
  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google orqali kirish',
    description: `
**Brauzerda oching:** \`GET /api/auth/google\`

Swagger da ishlamaydi — to'g'ridan brauzer URL satriga kiriting.
Google login sahifasiga yo'naltiriladi, keyin callback avtomatik chaqiriladi.
    `,
  })
  googleLogin() {
    // Passport avtomatik Google ga redirect qiladi
  }

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google callback — avtomatik chaqiriladi' })
  async googleCallback(@CurrentUser() oauthUser: any, @Res() res: Response) {
    const { token } = await this.authService.validateOAuthUser(oauthUser);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Frontend ga token bilan redirect
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  // ─── GITHUB OAUTH ─────────────────────────────────────────
  @Get('github')
  @Public()
  @UseGuards(GithubAuthGuard)
  @ApiOperation({
    summary: 'GitHub orqali kirish',
    description: `
**Brauzerda oching:** \`GET /api/auth/github\`

Swagger da ishlamaydi — to'g'ridan brauzer URL satriga kiriting.
GitHub login sahifasiga yo'naltiriladi, keyin callback avtomatik chaqiriladi.
    `,
  })
  githubLogin() {
    // Passport avtomatik GitHub ga redirect qiladi
  }

  @Get('github/callback')
  @Public()
  @UseGuards(GithubAuthGuard)
  @ApiOperation({ summary: 'GitHub callback — avtomatik chaqiriladi' })
  async githubCallback(@CurrentUser() oauthUser: any, @Res() res: Response) {
    const { token } = await this.authService.validateOAuthUser(oauthUser);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  // ─── USERS (SuperAdmin) ───────────────────────────────────
  @Post('users')
  @Roles(UserRole.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin yoki Teacher yaratish (faqat SUPERADMIN)' })
  @ApiResponse({ status: 201, description: 'Yaratildi' })
  @ApiResponse({ status: 409, description: 'Telefon allaqachon mavjud' })
  createUser(@Body() dto: CreateAdminDto) {
    return this.authService.createUser(dto);
  }

  @Get('users')
  @Roles(UserRole.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Barcha adminlar va o\'qituvchilar (faqat SUPERADMIN)' })
  getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Patch('users/:id/deactivate')
  @Roles(UserRole.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Foydalanuvchini bloklash' })
  @ApiParam({ name: 'id' })
  deactivateUser(@Param('id') id: string) {
    return this.authService.deactivateUser(id);
  }

  @Patch('users/:id/activate')
  @Roles(UserRole.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Foydalanuvchini aktivlashtirish' })
  @ApiParam({ name: 'id' })
  activateUser(@Param('id') id: string) {
    return this.authService.activateUser(id);
  }

  // ─── PROFILE ──────────────────────────────────────────────
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mening profilim' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Patch('profile')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('photo', {
    storage: photoStorage,
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        cb(new Error('Faqat rasm fayllari'), false);
        return;
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Profilni yangilash' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        currentPassword: { type: 'string' },
        newPassword: { type: 'string' },
        photo: { type: 'string', format: 'binary' },
      },
    },
  })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    const photoPath = photo ? `uploads/${photo.filename}` : undefined;
    return this.authService.updateProfile(userId, dto, photoPath);
  }
}
