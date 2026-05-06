import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, StudentFilterDto } from './dto/student.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

// Multer konfiguratsiyasi — rasm yuklash
const photoStorage = diskStorage({
  destination: './uploads/students',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `student-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

const imageFileFilter = (req: any, file: any, cb: any) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    cb(new Error('Faqat rasm fayllari qabul qilinadi (jpg, jpeg, png, webp)'), false);
    return;
  }
  cb(null, true);
};

@ApiTags('Students')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // ─── CREATE ───────────────────────────────────────────────
  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: photoStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiOperation({
    summary: 'Yangi o\'quvchi qo\'shish',
    description: 'Rasm ixtiyoriy (3x4 format). Faqat ADMIN va SUPERADMIN.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['fullName', 'phone', 'direction'],
      properties: {
        fullName: { type: 'string', example: 'Muxamadaliyev Ibrohim' },
        phone: { type: 'string', example: '+998901234567' },
        direction: { type: 'string', example: 'Matematika' },
        parentName: { type: 'string', example: 'Karimov Sardor' },
        parentPhone: { type: 'string', example: '+998901234567' },
        photo: { type: 'string', format: 'binary', description: '3x4 rasm (jpg/png, max 5MB)' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'O\'quvchi qo\'shildi' })
  @ApiResponse({ status: 409, description: 'Bu telefon raqam allaqachon mavjud' })
  create(
    @Body() dto: CreateStudentDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    const photoPath = photo ? `uploads/students/${photo.filename}` : undefined;
    return this.studentsService.create(dto, photoPath);
  }

  // ─── GET ALL (filter + pagination) ────────────────────────
  @Get()
  @ApiOperation({
    summary: 'O\'quvchilar ro\'yxati',
    description: `
      Qidiruv, filter va pagination qo'llab-quvvatlanadi.
      - **search**: ism, telefon yoki ota-ona ismi bo'yicha
      - **direction**: yo'nalish bo'yicha filter
      - **isActive**: true/false
      - **page**, **limit**: pagination
      - **sortBy**: fullName | createdAt | direction
      - **sortOrder**: ASC | DESC
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Muvaffaqiyatli',
    schema: {
      example: {
        data: [
          {
            id: 'uuid',
            fullName: 'Muxamadaliyev Ibrohim',
            phone: '+998901234567',
            direction: 'Matematika',
            parentName: 'Karimov Sardor',
            parentPhone: '+998901234567',
            photo: 'uploads/students/student-123.jpg',
            isActive: true,
            createdAt: '2022-01-27T00:00:00.000Z',
          },
        ],
        meta: {
          total: 150,
          page: 1,
          limit: 10,
          totalPages: 15,
          hasNext: true,
          hasPrev: false,
        },
      },
    },
  })
  findAll(@Query() filter: StudentFilterDto) {
    return this.studentsService.findAll(filter);
  }

  // ─── GET DIRECTIONS (filter dropdown uchun) ───────────────
  @Get('directions')
  @ApiOperation({
    summary: 'Barcha yo\'nalishlar ro\'yxati',
    description: 'Frontend filter dropdown uchun mavjud yo\'nalishlar.',
  })
  @ApiResponse({ status: 200, description: 'Yo\'nalishlar ro\'yxati', schema: { example: ['Matematika', 'Ona tili', 'Informatika'] } })
  getDirections() {
    return this.studentsService.getDirections();
  }

  // ─── GET STATS ────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'O\'quvchilar statistikasi (dashboard uchun)' })
  @ApiResponse({
    status: 200,
    schema: {
      example: { total: 255, active: 195, inactive: 60, thisMonth: 15, leftThisMonth: 60 },
    },
  })
  getStats() {
    return this.studentsService.getStats();
  }

  // ─── GET ONE ──────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Bitta o\'quvchi (guruhlari bilan)' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'O\'quvchi topildi' })
  @ApiResponse({ status: 404, description: 'O\'quvchi topilmadi' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.findOne(id);
  }

  // ─── UPDATE ───────────────────────────────────────────────
  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: photoStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'O\'quvchini tahrirlash' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        phone: { type: 'string' },
        direction: { type: 'string' },
        parentName: { type: 'string' },
        parentPhone: { type: 'string' },
        isActive: { type: 'boolean' },
        photo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Tahrirlandi' })
  @ApiResponse({ status: 404, description: 'Topilmadi' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    const photoPath = photo ? `uploads/students/${photo.filename}` : undefined;
    return this.studentsService.update(id, dto, photoPath);
  }

  // ─── SOFT DELETE ──────────────────────────────────────────
  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'O\'quvchini o\'chirish (soft delete)',
    description: 'isActive = false qilib belgilaydi. Ma\'lumotlar saqlanib qoladi.',
  })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'O\'chirildi' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.remove(id);
  }

  // ─── HARD DELETE (faqat superadmin) ───────────────────────
  @Delete(':id/permanent')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'O\'quvchini to\'liq o\'chirish (faqat SuperAdmin)',
    description: 'Bazadan butunlay o\'chiriladi. Qaytarib bo\'lmaydi!',
  })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'To\'liq o\'chirildi' })
  hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.hardDelete(id);
  }
}
