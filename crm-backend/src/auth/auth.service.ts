import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole, AuthProvider } from '../users/user.entity';
import { LoginDto, CreateAdminDto, UpdateProfileDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // ─── LOCAL LOGIN ──────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { phone: dto.phone, isActive: true },
    });
    if (!user) throw new UnauthorizedException('Telefon raqam yoki parol noto\'g\'ri');

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Telefon raqam yoki parol noto\'g\'ri');

    const token = this.generateToken(user);
    return {
      token,
      user: { id: user.id, fullName: user.fullName, phone: user.phone, role: user.role },
    };
  }

  // ─── GOOGLE / GITHUB OAUTH ────────────────────────────────
  async validateOAuthUser(oauthUser: {
    email: string;
    fullName: string;
    photo?: string;
    googleId?: string;
    githubId?: string;
    provider: string;
  }) {
    // 1. Google/GitHub ID bo'yicha qidiramiz
    let user: User;

    if (oauthUser.googleId) {
      user = await this.userRepo.findOne({
        where: { googleId: oauthUser.googleId },
      });
    } else if (oauthUser.githubId) {
      user = await this.userRepo.findOne({
        where: { githubId: oauthUser.githubId },
      });
    }

    // 2. Topilmasa email bo'yicha qidiramiz
    if (!user && oauthUser.email) {
      user = await this.userRepo.findOne({
        where: { email: oauthUser.email },
      });
    }

    // 3. Hali ham topilmasa — yangi user yaratamiz
    if (!user) {
      user = this.userRepo.create({
        fullName: oauthUser.fullName,
        email: oauthUser.email,
        photo: oauthUser.photo,
        googleId: oauthUser.googleId || null,
        githubId: oauthUser.githubId || null,
        provider: oauthUser.provider as AuthProvider,
        role: UserRole.ADMIN,
        passwordHash: '',
        isActive: true,
      });
      await this.userRepo.save(user);
    } else {
      // 4. Mavjud userga OAuth ID ni bog'laymiz
      if (oauthUser.googleId && !user.googleId) {
        user.googleId = oauthUser.googleId;
      }
      if (oauthUser.githubId && !user.githubId) {
        user.githubId = oauthUser.githubId;
      }
      if (oauthUser.photo && !user.photo) {
        user.photo = oauthUser.photo;
      }
      await this.userRepo.save(user);
    }

    const token = this.generateToken(user);
    return { token, user };
  }

  // ─── ADMIN YARATISH (SuperAdmin) ─────────────────────────
  async createUser(dto: CreateAdminDto) {
    const exists = await this.userRepo.findOne({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      ...dto,
      passwordHash,
      provider: AuthProvider.LOCAL,
    });
    await this.userRepo.save(user);

    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async getAllUsers() {
    return this.userRepo
      .createQueryBuilder('user')
      .where('user.role != :role', { role: UserRole.SUPERADMIN })
      .select([
        'user.id', 'user.fullName', 'user.phone', 'user.email',
        'user.role', 'user.provider', 'user.isActive', 'user.createdAt',
      ])
      .orderBy('user.role', 'ASC')
      .addOrderBy('user.fullName', 'ASC')
      .getMany();
  }

  async deactivateUser(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (user.role === UserRole.SUPERADMIN) throw new ConflictException('SuperAdminni o\'chirib bo\'lmaydi');
    user.isActive = false;
    await this.userRepo.save(user);
    return { message: 'Foydalanuvchi deaktiv qilindi' };
  }

  async activateUser(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    user.isActive = true;
    await this.userRepo.save(user);
    return { message: 'Foydalanuvchi aktiv qilindi' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'fullName', 'phone', 'email', 'role', 'photo', 'provider', 'isActive', 'createdAt'],
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto, photoPath?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    if (dto.newPassword) {
      if (!dto.currentPassword) throw new BadRequestException('Yangi parol uchun joriy parolni kiriting');
      const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!isValid) throw new BadRequestException('Joriy parol noto\'g\'ri');
      user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    }

    if (dto.fullName) user.fullName = dto.fullName;
    if (photoPath) user.photo = photoPath;

    await this.userRepo.save(user);
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      photo: user.photo,
      provider: user.provider,
    };
  }

  // ─── HELPER ──────────────────────────────────────────────
  private generateToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
    });
  }
}
