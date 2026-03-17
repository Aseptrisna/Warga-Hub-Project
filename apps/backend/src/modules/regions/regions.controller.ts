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
import { FileInterceptor } from '@nestjs/platform-express';
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RegionType } from './schemas/region.schema';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

const uploadStorage = diskStorage({
  destination: './uploads/regions',
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

@Controller('regions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  // ── AdminDesa: My Desa endpoints ──

  @Get('my-desa')
  @Roles(Role.ADMIN_DESA)
  getMyDesa(@CurrentUser() user: any) {
    return this.regionsService.getMyDesa(user);
  }

  @Patch('my-desa')
  @Roles(Role.ADMIN_DESA)
  updateMyDesa(@Body() dto: UpdateRegionDto, @CurrentUser() user: any) {
    return this.regionsService.updateMyDesa(dto, user);
  }

  @Patch('my-desa/landing')
  @Roles(Role.ADMIN_DESA)
  updateMyDesaLanding(@Body() body: any, @CurrentUser() user: any) {
    return this.regionsService.updateMyDesaLanding(body, user);
  }

  @Post('my-desa/logo')
  @Roles(Role.ADMIN_DESA)
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage }))
  uploadLogo(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.regionsService.uploadDesaImage(user, 'logoUrl', file);
  }

  @Post('my-desa/banner')
  @Roles(Role.ADMIN_DESA)
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage }))
  uploadBanner(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.regionsService.uploadDesaImage(user, 'bannerUrl', file);
  }

  // ── SuperAdmin: All Desa monitoring ──

  @Get('all-desa')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM)
  getAllDesa(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.regionsService.findAll({ type: RegionType.DESA, page, limit });
  }

  // ── Standard CRUD ──

  @Post()
  @Roles(
    Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA,
    Role.KEPALA_DESA, Role.SEKRETARIS_DESA,
    Role.KETUA_RW, Role.ADMIN_RW,
    Role.KETUA_RT, Role.ADMIN_RT,
  )
  create(@Body() createRegionDto: CreateRegionDto, @CurrentUser() user: any) {
    return this.regionsService.create(createRegionDto, user);
  }

  @Get()
  findAll(
    @Query('type') type?: RegionType,
    @Query('parentId') parentId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.regionsService.findAll({ type, parentId, search, page, limit });
  }

  @Get('tree')
  getTree(@Query('regionId') regionId?: string) {
    return this.regionsService.getHierarchyTree(regionId);
  }

  @Get('my-tree')
  getMyTree(@CurrentUser() user: any) {
    return this.regionsService.getMyTree(user);
  }

  @Get('subdomain/:subdomain')
  findBySubdomain(@Param('subdomain') subdomain: string) {
    return this.regionsService.findBySubdomain(subdomain);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.regionsService.findOne(id);
  }

  @Get(':id/breadcrumb')
  getBreadcrumb(@Param('id') id: string) {
    return this.regionsService.getParentChain(id);
  }

  @Get(':id/children')
  getChildren(@Param('id') id: string, @Query('type') type?: RegionType) {
    return this.regionsService.getChildren(id, type);
  }

  @Patch(':id')
  @Roles(
    Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA,
    Role.KEPALA_DESA, Role.SEKRETARIS_DESA,
    Role.KETUA_RW, Role.ADMIN_RW,
    Role.KETUA_RT, Role.ADMIN_RT,
  )
  update(@Param('id') id: string, @Body() updateRegionDto: UpdateRegionDto, @CurrentUser() user: any) {
    return this.regionsService.update(id, updateRegionDto, user);
  }

  @Delete(':id')
  @Roles(
    Role.SUPER_ADMIN, Role.ADMIN_PLATFORM,
    Role.KEPALA_DESA, Role.SEKRETARIS_DESA,
    Role.KETUA_RW, Role.ADMIN_RW,
  )
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.regionsService.remove(id, user);
  }
}
