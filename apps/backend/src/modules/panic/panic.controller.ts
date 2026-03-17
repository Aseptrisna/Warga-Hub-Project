import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PanicService } from './panic.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getRegionScope } from '../../common/helpers/region-scope.helper';

const panicStorage = diskStorage({
  destination: './uploads/panic',
  filename: (_req, file, cb) => {
    cb(null, `panic-${uuidv4()}${extname(file.originalname)}`);
  },
});

const imageFilter = (_req: any, file: any, cb: any) => {
  if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

@ApiTags('panic')
@Controller('panic')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PanicController {
  constructor(private readonly service: PanicService) {}

  @Get('my')
  getMyAlerts(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll({ ...query, pelaporId: user.id });
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: panicStorage,
      fileFilter: imageFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    const fotoUrl = file ? `/uploads/panic/${file.filename}` : undefined;
    // Parse lokasi if it's a JSON string (from FormData)
    let lokasi = data.lokasi;
    if (typeof lokasi === 'string') {
      try {
        lokasi = JSON.parse(lokasi);
      } catch {
        lokasi = { alamat: lokasi };
      }
    }
    return this.service.create({ ...data, lokasi, fotoUrl }, user);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT, Role.PETUGAS_RONDA)
  findAll(@Query() query: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.service.findAll({ ...query, ...scope });
  }

  @Get('active')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.KETUA_RW, Role.KETUA_RT, Role.ADMIN_RT, Role.PETUGAS_RONDA)
  getActive(@Query() filter: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.service.getActive({ ...filter, ...scope });
  }

  @Get('statistics')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.KETUA_RW, Role.KETUA_RT)
  getStatistics(@Query() filter: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.service.getStatistics({ ...filter, ...scope });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/respond')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.KETUA_RW, Role.KETUA_RT, Role.ADMIN_RT, Role.PETUGAS_RONDA)
  respond(
    @Param('id') id: string,
    @Body('tindakan') tindakan: string,
    @CurrentUser() user: any,
  ) {
    return this.service.respond(id, user.id, user.name, tindakan);
  }

  @Patch(':id/resolve')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.KETUA_RW, Role.KETUA_RT, Role.ADMIN_RT, Role.PETUGAS_RONDA)
  resolve(@Param('id') id: string, @Body('tindakan') tindakan?: string) {
    return this.service.resolve(id, tindakan);
  }
}
