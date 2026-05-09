import {
  Controller, Post, Get, Patch, Delete,
  Body, Param, UseGuards,
  UseInterceptors, UploadedFile, Res, Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, CreateAdminDto, UpdateProfileDto, LoginResponseDto, RefreshTokenDto } from './dto/auth.dto';
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

  @Post('login')
  @Public()
  @Throttle({ short: { limit: 10, ttl: 300000 } })
  @ApiOperation({ summary: 'Tizimga kirish — accessToken va refreshToken qaytaradi' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Noto\'g\'ri login yoki parol' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @Public()
  @ApiOperation({
    summary: 'Access token yangilash',
    description: 'refreshToken yuborib yangi accessToken olish. Token muddati tugaganda ishlatiladi.',
  })
  @ApiResponse({ status: 200, description: 'Yangi tokenlar' })
  @ApiResponse({ status: 401, description: 'Refresh token yaroqsiz' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tizimdan chiqish — refresh token o\'chiriladi' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli chiqildi' })
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @Get('callback')
  @Public()
  @ApiOperation({ summary: 'OAuth callback sahifasi' })
  callback(@Req() req: Request, @Res() res: Response) {
    const token = req.query.token as string;
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>CRM Login</title>
  <style>
    body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f2f5;margin:0}
    .card{background:white;padding:32px;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,.1);max-width:640px;width:90%}
    h2{color:#1a73e8;margin:0 0 8px}
    .token{background:#f8f9fa;border:1px solid #ddd;border-radius:8px;padding:12px;word-break:break-all;font-size:11px;max-height:100px;overflow-y:auto;margin:8px 0}
    .btns{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
    .btn{padding:10px 18px;border-radius:6px;border:none;cursor:pointer;font-size:14px;color:white;text-decoration:none}
    .blue{background:#1a73e8}.green{background:#34a853}
    .note{font-size:12px;color:#888;margin-top:12px}
  </style>
</head>
<body>
  <div class="card">
    <h2>Muvaffaqiyatli kirish!</h2>
    <p style="color:#34a853">Google/GitHub orqali kirish amalga oshdi.</p>
    <p><strong>Access Token:</strong></p>
    <div class="token" id="tok">${token}</div>
    <div class="btns">
      <button class="btn blue" onclick="copy()">Tokenni nusxalash</button>
      <a class="btn green" href="/api/docs">Swagger ga otish</a>
    </div>
    <p class="note">Swagger da: Authorize tugmasini bosib, Bearer [token] kiriting.</p>
  </div>
  <script>
    function copy(){
      navigator.clipboard.writeText(document.getElementById('tok').innerText)
        .then(()=>alert('Token nusxalandi!'));
    }
  </script>
</body>
</html>`);
  }

  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google orqali kirish — brauzerda oching' })
  googleLogin() {}

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google callback' })
  async googleCallback(@CurrentUser() oauthUser: any, @Res() res: Response) {
    const { accessToken } = await this.authService.validateOAuthUser(oauthUser);
    res.redirect(`http://localhost:3000/api/auth/callback?token=${accessToken}`);
  }

  @Get('github')
  @Public()
  @UseGuards(GithubAuthGuard)
  @ApiOperation({ summary: 'GitHub orqali kirish — brauzerda oching' })
  githubLogin() {}

  @Get('github/callback')
  @Public()
  @UseGuards(GithubAuthGuard)
  @ApiOperation({ summary: 'GitHub callback' })
  async githubCallback(@CurrentUser() oauthUser: any, @Res() res: Response) {
    const { accessToken } = await this.authService.validateOAuthUser(oauthUser);
    res.redirect(`http://localhost:3000/api/auth/callback?token=${accessToken}`);
  }

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
  @ApiOperation({ summary: 'Barcha foydalanuvchilar (faqat SUPERADMIN)' })
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

  @Delete('users/:id')
  @Roles(UserRole.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Foydalanuvchini o\'chirish (soft delete)' })
  @ApiParam({ name: 'id' })
  deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }

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
        cb(new Error('Faqat rasm fayllari'), false); return;
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
