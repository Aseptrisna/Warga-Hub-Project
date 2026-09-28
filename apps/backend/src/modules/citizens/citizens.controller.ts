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
  Res,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { s3Storage } from '../../common/services/s3-storage';
import { Response } from 'express';
import { CitizensService } from './citizens.service';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getRegionScope } from '../../common/helpers/region-scope.helper';

const imageFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const docFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files and PDFs are allowed!'), false);
  }
};

const citizenStorage = s3Storage('citizens');

// Roles that can manage citizen data (matching frontend permissions.ts)
const CITIZEN_MANAGE_ROLES = [
  Role.SUPER_ADMIN, Role.ADMIN_PLATFORM,
  Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_UMUM, Role.KASI_PEMERINTAHAN,
  Role.KETUA_RW, Role.ADMIN_RW,
  Role.KETUA_RT, Role.ADMIN_RT,
];

const CITIZEN_DELETE_ROLES = [
  Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA,
];

@ApiTags('citizens')
@Controller('citizens')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CitizensController {
  private readonly logger = new Logger(CitizensController.name);

  constructor(private readonly citizensService: CitizensService) {}

  // Helper: resolve citizen ID from user (citizenId or NIK fallback)
  private async resolveCitizenId(user: any): Promise<string | null> {
    if (user.citizenId) return user.citizenId;
    if (user.nik) {
      try {
        const citizen = await this.citizensService.findByNik(user.nik);
        return citizen?._id || null;
      } catch (err) {
        // Expected when the user's NIK has no matching citizen record yet.
        this.logger.debug(`No citizen found for NIK ${user.nik}: ${(err as Error).message}`);
        return null;
      }
    }
    return null;
  }

  // ============ MY PROFILE ENDPOINTS (Warga self-service) ============

  @Get('my-profile')
  @ApiOperation({ summary: 'Get my citizen profile (authenticated warga)' })
  async getMyProfile(@CurrentUser() user: any) {
    const citizenId = await this.resolveCitizenId(user);
    if (!citizenId) {
      return { message: 'Data kependudukan belum terhubung', data: null };
    }
    return this.citizensService.findOne(citizenId);
  }

  @Patch('my-profile')
  @ApiOperation({ summary: 'Update limited fields of my profile' })
  async updateMyProfile(@CurrentUser() user: any, @Body() body: UpdateMyProfileDto) {
    const citizenId = await this.resolveCitizenId(user);
    if (!citizenId) {
      return { message: 'Data kependudukan belum terhubung', data: null };
    }
    const allowed = {
      noTelp: body.noTelp,
      email: body.email,
      alamat: body.alamat,
      npwp: body.npwp,
      noBpjsKesehatan: body.noBpjsKesehatan,
      noBpjsKetenagakerjaan: body.noBpjsKetenagakerjaan,
    };
    const filtered: any = {};
    for (const [key, val] of Object.entries(allowed)) {
      if (val !== undefined) filtered[key] = val;
    }
    return this.citizensService.update(citizenId, filtered);
  }

  @Post('my-profile/upload-photo')
  @ApiOperation({ summary: 'Upload my photo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadMyPhoto(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const citizenId = await this.resolveCitizenId(user);
    if (!citizenId) return { message: 'Data kependudukan belum terhubung' };
    const fileUrl = (file as any).location;
    return this.citizensService.update(citizenId, { fotoUrl: fileUrl } as any);
  }

  @Post('my-profile/upload-ktp')
  @ApiOperation({ summary: 'Upload my KTP' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadMyKtp(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const citizenId = await this.resolveCitizenId(user);
    if (!citizenId) return { message: 'Data kependudukan belum terhubung' };
    const fileUrl = (file as any).location;
    return this.citizensService.update(citizenId, { ktpUrl: fileUrl } as any);
  }

  @Post('my-profile/upload-kk')
  @ApiOperation({ summary: 'Upload my KK' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadMyKk(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const citizenId = await this.resolveCitizenId(user);
    if (!citizenId) return { message: 'Data kependudukan belum terhubung' };
    const fileUrl = (file as any).location;
    return this.citizensService.update(citizenId, { kkUrl: fileUrl } as any);
  }

  @Post('my-profile/upload-akta')
  @ApiOperation({ summary: 'Upload my Akta Lahir' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadMyAkta(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const citizenId = await this.resolveCitizenId(user);
    if (!citizenId) return { message: 'Data kependudukan belum terhubung' };
    const fileUrl = (file as any).location;
    return this.citizensService.update(citizenId, { aktaLahirUrl: fileUrl } as any);
  }

  @Post('my-profile/upload-surat-nikah')
  @ApiOperation({ summary: 'Upload my Surat Nikah' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadMySuratNikah(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const citizenId = await this.resolveCitizenId(user);
    if (!citizenId) return { message: 'Data kependudukan belum terhubung' };
    const fileUrl = (file as any).location;
    return this.citizensService.update(citizenId, { suratNikahUrl: fileUrl } as any);
  }

  @Post('my-profile/upload-ijazah')
  @ApiOperation({ summary: 'Upload my Ijazah' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadMyIjazah(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const citizenId = await this.resolveCitizenId(user);
    if (!citizenId) return { message: 'Data kependudukan belum terhubung' };
    const fileUrl = (file as any).location;
    return this.citizensService.update(citizenId, { ijazahUrl: fileUrl } as any);
  }

  @Post('my-profile/upload-bpjs')
  @ApiOperation({ summary: 'Upload my BPJS Kesehatan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadMyBpjs(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const citizenId = await this.resolveCitizenId(user);
    if (!citizenId) return { message: 'Data kependudukan belum terhubung' };
    const fileUrl = (file as any).location;
    return this.citizensService.update(citizenId, { bpjsKesehatanUrl: fileUrl } as any);
  }

  @Post('my-profile/upload-bpjs-ketenagakerjaan')
  @ApiOperation({ summary: 'Upload my BPJS Ketenagakerjaan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadMyBpjsTK(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const citizenId = await this.resolveCitizenId(user);
    if (!citizenId) return { message: 'Data kependudukan belum terhubung' };
    const fileUrl = (file as any).location;
    return this.citizensService.update(citizenId, { bpjsKetenagakerjaanUrl: fileUrl } as any);
  }

  @Post('my-profile/upload-vaksin')
  @ApiOperation({ summary: 'Upload my Vaksin certificate' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadMyVaksin(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const citizenId = await this.resolveCitizenId(user);
    if (!citizenId) return { message: 'Data kependudukan belum terhubung' };
    const fileUrl = (file as any).location;
    return this.citizensService.update(citizenId, { vaksinUrl: fileUrl } as any);
  }

  @Post('my-profile/upload-skck')
  @ApiOperation({ summary: 'Upload my SKCK' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadMySkck(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const citizenId = await this.resolveCitizenId(user);
    if (!citizenId) return { message: 'Data kependudukan belum terhubung' };
    const fileUrl = (file as any).location;
    return this.citizensService.update(citizenId, { skckUrl: fileUrl } as any);
  }

  // ============ ADMIN ENDPOINTS ============

  @Post()
  @Roles(...CITIZEN_MANAGE_ROLES)
  @ApiOperation({ summary: 'Create new citizen' })
  create(@Body() createCitizenDto: CreateCitizenDto, @CurrentUser() user: any) {
    return this.citizensService.create(createCitizenDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all citizens with pagination and filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'rt', required: false })
  @ApiQuery({ name: 'rw', required: false })
  @ApiQuery({ name: 'desa', required: false })
  @ApiQuery({ name: 'noKk', required: false })
  @ApiQuery({ name: 'jenisKelamin', required: false })
  @ApiQuery({ name: 'statusPerkawinan', required: false })
  @ApiQuery({ name: 'agama', required: false })
  @ApiQuery({ name: 'pendidikan', required: false })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.citizensService.findAll({ ...query, ...scope });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get citizen statistics' })
  getStatistics(@Query() filter: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.citizensService.getStatistics({ ...filter, ...scope });
  }

  @Get('families')
  @ApiOperation({ summary: 'Get unique family (KK) list' })
  getFamilies(@CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.citizensService.getUniqueNoKk(scope);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export citizens to Excel' })
  async exportExcel(@Query() query: any, @Res() res: Response, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    const buffer = await this.citizensService.exportToExcel({ ...query, ...scope }, user);
    const timestamp = new Date().toISOString().split('T')[0];

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=data-warga-${timestamp}.xlsx`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }

  @Post('import')
  @Roles(...CITIZEN_MANAGE_ROLES)
  @ApiOperation({ summary: 'Import citizens from Excel' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype === 'application/vnd.ms-excel'
        ) {
          cb(null, true);
        } else {
          cb(new Error('Only Excel files (.xlsx) are allowed!'), false);
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async importExcel(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.citizensService.importFromExcel(file.buffer, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get citizen by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.citizensService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(...CITIZEN_MANAGE_ROLES)
  @ApiOperation({ summary: 'Update citizen' })
  update(@Param('id') id: string, @Body() updateCitizenDto: UpdateCitizenDto, @CurrentUser() user: any) {
    return this.citizensService.update(id, updateCitizenDto, user);
  }

  @Delete(':id')
  @Roles(...CITIZEN_DELETE_ROLES)
  @ApiOperation({ summary: 'Delete citizen' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.citizensService.remove(id, user);
  }

  // Upload endpoints
  @Post(':id/upload-photo')
  @Roles(...CITIZEN_MANAGE_ROLES)
  @ApiOperation({ summary: 'Upload citizen photo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadPhoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const fileUrl = (file as any).location;
    return this.citizensService.update(id, { fotoUrl: fileUrl } as any, user);
  }

  @Post(':id/upload-ktp')
  @Roles(...CITIZEN_MANAGE_ROLES)
  @ApiOperation({ summary: 'Upload KTP scan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadKTP(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const fileUrl = (file as any).location;
    return this.citizensService.update(id, { ktpUrl: fileUrl } as any, user);
  }

  @Post(':id/upload-kk')
  @Roles(...CITIZEN_MANAGE_ROLES)
  @ApiOperation({ summary: 'Upload KK scan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadKK(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const fileUrl = (file as any).location;
    return this.citizensService.update(id, { kkUrl: fileUrl } as any, user);
  }

  @Post(':id/upload-akta')
  @Roles(...CITIZEN_MANAGE_ROLES)
  @ApiOperation({ summary: 'Upload Akta Lahir scan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadAkta(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const fileUrl = (file as any).location;
    return this.citizensService.update(id, { aktaLahirUrl: fileUrl } as any, user);
  }

  @Post(':id/upload-surat-nikah')
  @Roles(...CITIZEN_MANAGE_ROLES)
  @ApiOperation({ summary: 'Upload Surat Nikah scan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadSuratNikah(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const fileUrl = (file as any).location;
    return this.citizensService.update(id, { suratNikahUrl: fileUrl } as any, user);
  }

  @Post(':id/upload-ijazah')
  @Roles(...CITIZEN_MANAGE_ROLES)
  @ApiOperation({ summary: 'Upload Ijazah scan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadIjazah(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const fileUrl = (file as any).location;
    return this.citizensService.update(id, { ijazahUrl: fileUrl } as any, user);
  }

  @Post(':id/upload-bpjs-kesehatan')
  @Roles(...CITIZEN_MANAGE_ROLES)
  @ApiOperation({ summary: 'Upload BPJS Kesehatan scan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadBpjsKesehatan(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const fileUrl = (file as any).location;
    return this.citizensService.update(id, { bpjsKesehatanUrl: fileUrl } as any, user);
  }

  @Post(':id/upload-vaksin')
  @Roles(...CITIZEN_MANAGE_ROLES)
  @ApiOperation({ summary: 'Upload Vaksin certificate' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadVaksin(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const fileUrl = (file as any).location;
    return this.citizensService.update(id, { vaksinUrl: fileUrl } as any, user);
  }

  @Post(':id/upload-skck')
  @Roles(...CITIZEN_MANAGE_ROLES)
  @ApiOperation({ summary: 'Upload SKCK scan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: citizenStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadSkck(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    const fileUrl = (file as any).location;
    return this.citizensService.update(id, { skckUrl: fileUrl } as any, user);
  }
}
