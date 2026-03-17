import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getRegionScope } from '../../common/helpers/region-scope.helper';

const buktiStorage = diskStorage({
  destination: './uploads/payments',
  filename: (_req, file, cb) => {
    const uniqueName = `bukti-${uuidv4()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const buktiFilter = (_req: any, file: any, cb: any) => {
  if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files and PDFs are allowed!'), false);
  }
};

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get my payments (authenticated warga)' })
  getMyPayments(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll({ ...query, citizenId: user.citizenId });
  }

  @Post()
  @Roles(
    Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA,
    Role.KAUR_KEUANGAN, Role.KETUA_RW, Role.KETUA_RT, Role.ADMIN_RT,
  )
  @ApiOperation({ summary: 'Create payment record' })
  create(@Body() data: any, @CurrentUser() user: any) {
    return this.service.create(data, user.id, user.name);
  }

  @Post('generate-bulk')
  @Roles(
    Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA,
    Role.KAUR_KEUANGAN, Role.SEKRETARIS_DESA,
    Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
  )
  @ApiOperation({ summary: 'Generate bulk payment records for all citizens x iuran types' })
  generateBulk(@Body() data: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.service.generateBulk({ ...data, ...scope }, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments with pagination' })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.service.findAll({ ...query, ...scope });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get payment statistics' })
  getStatistics(@Query() filter: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.service.getStatistics({ ...filter, ...scope });
  }

  @Get('matrix')
  @Roles(
    Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA,
    Role.KAUR_KEUANGAN, Role.SEKRETARIS_DESA,
    Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
  )
  @ApiOperation({ summary: 'Get payment matrix (citizens x iuran types)' })
  getMatrix(@Query() query: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.service.getMatrix({ ...query, ...scope });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KAUR_KEUANGAN, Role.KETUA_RT, Role.ADMIN_RT)
  @ApiOperation({ summary: 'Update payment' })
  update(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    return this.service.update(id, data, user);
  }

  @Post(':id/upload-bukti')
  @ApiOperation({ summary: 'Upload bukti pembayaran' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: buktiStorage,
      fileFilter: buktiFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadBukti(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    const fileUrl = `/uploads/payments/${file.filename}`;
    return this.service.uploadBukti(id, fileUrl, user);
  }

  @Patch(':id/verify')
  @Roles(
    Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA,
    Role.KAUR_KEUANGAN, Role.SEKRETARIS_DESA,
    Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
  )
  @ApiOperation({ summary: 'Verify payment (approve/reject)' })
  verify(
    @Param('id') id: string,
    @Body() dto: { status: 'Lunas' | 'Ditolak'; rejectionReason?: string },
    @CurrentUser() user: any,
  ) {
    return this.service.verify(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.KAUR_KEUANGAN)
  @ApiOperation({ summary: 'Delete payment' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }
}
