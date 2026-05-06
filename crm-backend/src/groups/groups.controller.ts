import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UseInterceptors,
  UploadedFile, ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiConsumes, ApiBody, ApiParam,
} from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, GroupFilterDto, AddStudentToGroupDto } from './dto/group.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, User } from '../users/user.entity';

const photoStorage = diskStorage({
  destination: './uploads/groups',
  filename: (req, file, cb) => {
    cb(null, `group-${Date.now()}${extname(file.originalname)}`);
  },
});
const imgFilter = (req: any, file: any, cb: any) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    cb(new Error('Faqat rasm fayllari'), false); return;
  }
  cb(null, true);
};

@ApiTags('Groups')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('teacherPhoto', { storage: photoStorage, fileFilter: imgFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Yangi guruh yaratish (ADMIN, SUPERADMIN)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['direction', 'lessonDays', 'lessonTime'],
      properties: {
        direction: { type: 'string', example: 'Matematika' },
        lessonDays: { type: 'string', example: 'DU-CHOR-JUMA' },
        lessonTime: { type: 'string', example: '14:00-16:00' },
        teacherId: { type: 'string', example: 'uuid' },
        teacherPhoto: { type: 'string', format: 'binary' },
      },
    },
  })
  create(@Body() dto: CreateGroupDto, @UploadedFile() photo?: Express.Multer.File) {
    const photoPath = photo ? `uploads/groups/${photo.filename}` : undefined;
    return this.groupsService.create(dto, photoPath);
  }

  @Get()
  @ApiOperation({
    summary: 'Guruhlar ro\'yxati',
    description: 'TEACHER — faqat o\'z guruhlarini ko\'radi. ADMIN/SUPERADMIN — barchasini.',
  })
  findAll(@Query() filter: GroupFilterDto, @CurrentUser() user: User) {
    return this.groupsService.findAll(filter, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta guruh (o\'quvchilar bilan)' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.groupsService.findOne(id, user);
  }

  @Get(':id/students')
  @ApiOperation({
    summary: 'Guruh o\'quvchilari + shu oy to\'lov holati',
    description: 'Har bir o\'quvchida paidThisMonth: true/false belgisi bo\'ladi.',
  })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  getStudents(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.groupsService.getGroupStudentsWithPayment(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('teacherPhoto', { storage: photoStorage, fileFilter: imgFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Guruhni tahrirlash' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        direction: { type: 'string' },
        lessonDays: { type: 'string' },
        lessonTime: { type: 'string' },
        teacherId: { type: 'string' },
        teacherPhoto: { type: 'string', format: 'binary' },
      },
    },
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupDto,
    @CurrentUser() user: User,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    const photoPath = photo ? `uploads/groups/${photo.filename}` : undefined;
    return this.groupsService.update(id, dto, photoPath, user);
  }

  @Post(':id/students')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Guruhga o\'quvchi qo\'shish' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  addStudent(@Param('id', ParseUUIDPipe) groupId: string, @Body() dto: AddStudentToGroupDto) {
    return this.groupsService.addStudent(groupId, dto.studentId);
  }

  @Delete(':id/students/:studentId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Guruhdan o\'quvchi chiqarish' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  removeStudent(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.groupsService.removeStudent(groupId, studentId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Guruhni o\'chirish (soft delete)' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.groupsService.remove(id);
  }
}
