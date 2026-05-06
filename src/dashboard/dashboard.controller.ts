import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Asosiy statistika',
    description: 'Jami o\'quvchilar, o\'qituvchilar, guruhlar, shu oy ketganlar va to\'lovlar.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        totalStudents: 255,
        totalTeachers: 10,
        totalGroups: 26,
        leftThisMonth: 60,
        complaintsToday: 7,
        thisMonthPayments: 15000000,
      },
    },
  })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('monthly')
  @ApiOperation({
    summary: 'Oylik statistika (grafik uchun)',
    description: 'Yil bo\'yicha har oyda o\'quvchilar, ketganlar va to\'lovlar.',
  })
  @ApiQuery({ name: 'year', example: 2022, required: false })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        year: 2022,
        months: [
          { month: 1, monthName: 'yanvar', students: 261, leftStudents: 46, paymentsTotal: 5000000 },
        ],
      },
    },
  })
  getMonthly(@Query('year') year: number) {
    return this.dashboardService.getMonthlyStats(year || new Date().getFullYear());
  }

  @Get('directions')
  @ApiOperation({ summary: 'Top yo\'nalishlar statistikasi' })
  getTopDirections() {
    return this.dashboardService.getTopDirections();
  }
}
