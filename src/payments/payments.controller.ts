import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PaymentFilterDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'To\'lov qilish', description: 'Yangi to\'lov yaratish. teacherId avtomatik token dan olinadi.' })
  @ApiResponse({ status: 201, description: 'To\'lov saqlandi' })
  create(@Body() dto: CreatePaymentDto, @CurrentUser('id') userId: string) {
    return this.paymentsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'To\'lovlar ro\'yxati',
    description: 'Filter: studentId, groupId, teacherId, dateFrom, dateTo, thisMonth, search. Pagination: page, limit.',
  })
  @ApiResponse({ status: 200, description: 'Ro\'yxat' })
  findAll(@Query() filter: PaymentFilterDto) {
    return this.paymentsService.findAll(filter);
  }

  @Get('monthly-summary')
  @ApiOperation({ summary: 'Oylik to\'lovlar summasi (grafik uchun)' })
  @ApiQuery({ name: 'year', example: 2022 })
  getMonthlySummary(@Query('year') year: number) {
    return this.paymentsService.getMonthlySummary(year || new Date().getFullYear());
  }

  @Get('unpaid/:groupId')
  @ApiOperation({ summary: 'Guruhda shu oy to\'lov qilmaganlar ID ro\'yxati' })
  @ApiParam({ name: 'groupId', description: 'Group UUID' })
  getUnpaid(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.paymentsService.getUnpaidStudents(groupId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'To\'lovni o\'chirish' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.remove(id);
  }
}
