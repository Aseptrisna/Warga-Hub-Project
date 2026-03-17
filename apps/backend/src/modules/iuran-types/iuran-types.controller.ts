import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IuranTypesService } from './iuran-types.service';
import { CreateIuranTypeDto } from './dto/create-iuran-type.dto';
import { UpdateIuranTypeDto } from './dto/update-iuran-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getRegionScope } from '../../common/helpers/region-scope.helper';

@ApiTags('iuran-types')
@Controller('iuran-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IuranTypesController {
  constructor(private readonly service: IuranTypesService) {}

  @Post()
  @Roles(
    Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA,
    Role.KAUR_KEUANGAN, Role.SEKRETARIS_DESA,
    Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
  )
  @ApiOperation({ summary: 'Create new iuran type' })
  create(@Body() dto: CreateIuranTypeDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id, user.name);
  }

  @Get()
  @ApiOperation({ summary: 'Get all iuran types (region-scoped)' })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.service.findAll({ ...query, ...scope });
  }

  @Get('applicable')
  @ApiOperation({ summary: 'Get iuran types applicable to current user' })
  findApplicable(@CurrentUser() user: any) {
    return this.service.findApplicable(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get iuran type by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(
    Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA,
    Role.KAUR_KEUANGAN, Role.SEKRETARIS_DESA,
    Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
  )
  @ApiOperation({ summary: 'Update iuran type' })
  update(@Param('id') id: string, @Body() dto: UpdateIuranTypeDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(
    Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA,
    Role.KAUR_KEUANGAN, Role.SEKRETARIS_DESA,
    Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT,
  )
  @ApiOperation({ summary: 'Delete iuran type' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }
}
