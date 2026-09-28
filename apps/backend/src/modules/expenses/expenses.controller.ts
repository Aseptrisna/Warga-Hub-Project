import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { s3Storage } from '../../common/services/s3-storage';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getRegionScope } from '../../common/helpers/region-scope.helper';

const expenseStorage = s3Storage('expenses');

const docFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files and PDFs are allowed!'), false);
  }
};

@ApiTags('expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.KAUR_KEUANGAN, Role.KEPALA_DESA, Role.KETUA_RW, Role.KETUA_RT, Role.ADMIN_RT)
  @ApiOperation({ summary: 'Create new expense' })
  create(@Body() createExpenseDto: CreateExpenseDto, @Req() req: any) {
    return this.expensesService.create(createExpenseDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expenses with pagination and filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'kategori', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.expensesService.findAll({ ...query, ...scope });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get expense statistics' })
  getStatistics(@Query() filter: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.expensesService.getStatistics({ ...filter, ...scope });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.KAUR_KEUANGAN, Role.KEPALA_DESA)
  @ApiOperation({ summary: 'Update expense' })
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(id, updateExpenseDto);
  }

  @Patch(':id/approve')
  @Roles(Role.SUPER_ADMIN, Role.KAUR_KEUANGAN, Role.KEPALA_DESA, Role.SEKRETARIS_DESA)
  @ApiOperation({ summary: 'Approve expense' })
  approve(@Param('id') id: string, @Req() req: any) {
    return this.expensesService.approve(id, req.user);
  }

  @Patch(':id/reject')
  @Roles(Role.SUPER_ADMIN, Role.KAUR_KEUANGAN, Role.KEPALA_DESA, Role.SEKRETARIS_DESA)
  @ApiOperation({ summary: 'Reject expense' })
  reject(@Param('id') id: string, @Body() body: { reason?: string }, @Req() req: any) {
    return this.expensesService.reject(id, req.user, body.reason);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.KAUR_KEUANGAN)
  @ApiOperation({ summary: 'Delete expense' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.expensesService.remove(id, req.user);
  }

  @Post(':id/upload-bukti')
  @Roles(Role.SUPER_ADMIN, Role.KAUR_KEUANGAN, Role.KEPALA_DESA, Role.KETUA_RT, Role.ADMIN_RT)
  @ApiOperation({ summary: 'Upload expense receipt' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: expenseStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadBukti(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.expensesService.update(id, { buktiUrl: (file as any).location } as any);
  }
}
