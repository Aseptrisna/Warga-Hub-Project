import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getRegionScope } from '../../common/helpers/region-scope.helper';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KASI_KESEJAHTERAAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT)
  create(@Body() dto: CreateEventDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id, user.name);
  }

  @Get()
  findAll(@Query() query: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.service.findAll({ ...query, ...scope });
  }

  @Get('statistics')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KASI_KESEJAHTERAAN, Role.KETUA_RW, Role.KETUA_RT)
  getStatistics(@Query() filter: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.service.getStatistics({ ...filter, ...scope });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KASI_KESEJAHTERAAN, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT)
  update(@Param('id') id: string, @Body() dto: UpdateEventDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user);
  }

  @Post(':id/register')
  register(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.register(id, user.id, user.name);
  }

  @Post(':id/unregister')
  unregister(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.unregister(id, user.id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }
}
