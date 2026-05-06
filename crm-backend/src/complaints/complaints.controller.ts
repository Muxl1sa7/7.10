import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, ComplaintFilterDto } from './dto/complaint.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @Public()
  @ApiOperation({
    summary: 'Yangi murojat yuborish',
    description: 'Bu endpoint ochiq — token talab qilinmaydi. O\'quvchi yoki ota-ona murojat qila oladi.',
  })
  @ApiResponse({ status: 201, description: 'Murojat qabul qilindi' })
  create(@Body() dto: CreateComplaintDto) {
    return this.complaintsService.create(dto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Murojatlar ro\'yxati (kunlar bo\'yicha guruhlangan)',
    description: 'Filter: date, dateFrom, dateTo, search. Pagination: page, limit.',
  })
  @ApiResponse({
    status: 200,
    description: 'Muvaffaqiyatli',
    schema: {
      example: {
        data: [
          {
            date: '2022-03-27',
            complaints: [
              { id: 'uuid', studentName: 'Ibrohim', phone: '+998...', description: '...' },
            ],
          },
        ],
        meta: { total: 10, page: 1, limit: 10, totalPages: 1 },
      },
    },
  })
  findAll(@Query() filter: ComplaintFilterDto) {
    return this.complaintsService.findAll(filter);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Murojatni o\'chirish' })
  @ApiParam({ name: 'id', description: 'Complaint UUID' })
  @ApiResponse({ status: 200, description: 'O\'chirildi' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.complaintsService.remove(id);
  }
}
