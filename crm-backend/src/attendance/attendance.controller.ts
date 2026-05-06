import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { BulkAttendanceDto, AttendanceFilterDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('bulk')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: 'Guruh davomatini saqlash (bulk)',
    description: 'Bir guruhning bir kunlik davomati. Mavjud bo\'lsa yangilaydi (upsert).',
  })
  @ApiResponse({ status: 201, description: 'Davomat saqlandi' })
  saveBulk(@Body() dto: BulkAttendanceDto) {
    return this.attendanceService.saveBulk(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Davomat ro\'yxati',
    description: 'Filter: groupId, studentId, date, dateFrom, dateTo, absentOnly. Pagination: page, limit.',
  })
  findAll(@Query() filter: AttendanceFilterDto) {
    return this.attendanceService.findAll(filter);
  }

  @Get('group/:groupId/date/:date')
  @ApiOperation({ summary: 'Guruhning bitta kunlik davomati' })
  @ApiParam({ name: 'groupId', description: 'Group UUID' })
  @ApiParam({ name: 'date', description: 'Sana: YYYY-MM-DD', example: '2022-03-07' })
  getByGroupAndDate(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('date') date: string,
  ) {
    return this.attendanceService.getByGroupAndDate(groupId, date);
  }

  @Get('absent/:groupId/date/:date')
  @ApiOperation({ summary: 'Kelmagan o\'quvchilar — sana bo\'yicha' })
  @ApiParam({ name: 'groupId', description: 'Group UUID' })
  @ApiParam({ name: 'date', description: 'Sana: YYYY-MM-DD' })
  getAbsent(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('date') date: string,
  ) {
    return this.attendanceService.getAbsentByDate(groupId, date);
  }

  @Get('rate/:studentId/:groupId')
  @ApiOperation({ summary: 'O\'quvchining davomat foizi' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiParam({ name: 'groupId', description: 'Group UUID' })
  getRate(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    return this.attendanceService.getStudentAttendanceRate(studentId, groupId);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Oylik davomat statistikasi (dashboard uchun)' })
  @ApiQuery({ name: 'year', example: 2022, required: false })
  getMonthly(@Query('year') year: number) {
    return this.attendanceService.getMonthlyStats(year || new Date().getFullYear());
  }
}
