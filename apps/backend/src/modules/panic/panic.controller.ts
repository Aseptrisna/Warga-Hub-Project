import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PanicService } from './panic.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getRegionScope } from '../../common/helpers/region-scope.helper';

@ApiTags('panic')
@Controller('panic')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PanicController {
  constructor(private readonly service: PanicService) {}

  @Post()
  create(@Body() data: any, @CurrentUser() user: any) {
    return this.service.create(data, user.id, user.name);
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
