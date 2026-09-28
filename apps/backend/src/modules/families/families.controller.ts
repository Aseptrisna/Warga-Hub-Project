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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { s3Storage } from '../../common/services/s3-storage';
import { FamiliesService } from './families.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getRegionScope } from '../../common/helpers/region-scope.helper';

const familyStorage = s3Storage('families');

const docFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files and PDFs are allowed!'), false);
  }
};

const FAMILY_MANAGE_ROLES = [
  Role.SUPER_ADMIN, Role.ADMIN_PLATFORM,
  Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KAUR_UMUM, Role.KASI_PEMERINTAHAN,
  Role.KETUA_RW, Role.ADMIN_RW,
  Role.KETUA_RT, Role.ADMIN_RT,
];

const FAMILY_DELETE_ROLES = [
  Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA,
];

@ApiTags('families')
@Controller('families')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  @Roles(...FAMILY_MANAGE_ROLES)
  @ApiOperation({ summary: 'Create new family (KK)' })
  create(@Body() createFamilyDto: CreateFamilyDto, @CurrentUser() user: any) {
    return this.familiesService.create(createFamilyDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all families with pagination and filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'rt', required: false })
  @ApiQuery({ name: 'rw', required: false })
  @ApiQuery({ name: 'desa', required: false })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.familiesService.findAll({ ...query, ...scope });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get family statistics' })
  getStatistics(@Query() filter: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.familiesService.getStatistics({ ...filter, ...scope });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get family by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.familiesService.findOne(id, user);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get family members' })
  getMembers(@Param('id') id: string, @CurrentUser() user: any) {
    return this.familiesService.getMembers(id, user);
  }

  @Patch(':id')
  @Roles(...FAMILY_MANAGE_ROLES)
  @ApiOperation({ summary: 'Update family' })
  update(@Param('id') id: string, @Body() updateFamilyDto: UpdateFamilyDto, @CurrentUser() user: any) {
    return this.familiesService.update(id, updateFamilyDto, user);
  }

  @Patch(':id/sync-members')
  @Roles(...FAMILY_MANAGE_ROLES)
  @ApiOperation({ summary: 'Sync family member count from citizens data' })
  syncMemberCount(@Param('id') id: string) {
    return this.familiesService.syncMemberCount(id);
  }

  @Delete(':id')
  @Roles(...FAMILY_DELETE_ROLES)
  @ApiOperation({ summary: 'Delete family' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.familiesService.remove(id, user);
  }

  @Post(':id/upload-kk')
  @Roles(...FAMILY_MANAGE_ROLES)
  @ApiOperation({ summary: 'Upload KK scan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: familyStorage, fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadKK(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.familiesService.update(id, { kkUrl: (file as any).location } as any, user);
  }
}
