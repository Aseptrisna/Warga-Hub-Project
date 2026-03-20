import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PatrolSchedulesService } from './patrol-schedules.service';
import { CreatePatrolScheduleDto, UpdatePatrolScheduleDto } from './dto/create-patrol-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { PatrolStatus } from './schemas/patrol-schedule.schema';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getRegionScope } from '../../common/helpers/region-scope.helper';

@Controller('patrol-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatrolSchedulesController {
  constructor(private readonly schedulesService: PatrolSchedulesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT)
  create(@Body() createDto: CreatePatrolScheduleDto, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.schedulesService.create({ ...createDto, ...scope });
  }

  @Get()
  findAll(
    @Query('regionId') regionId?: string,
    @Query('status') status?: PatrolStatus,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('assignedOfficer') assignedOfficer?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: any,
  ) {
    const scope = getRegionScope(user);
    return this.schedulesService.findAll({
      regionId,
      status,
      date,
      startDate,
      endDate,
      assignedOfficer,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      ...scope,
    });
  }

  @Get('statistics')
  getStatistics(
    @Query('regionId') regionId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    const scope = getRegionScope(user);
    return this.schedulesService.getStatistics({ regionId, startDate, endDate, ...scope });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT)
  update(@Param('id') id: string, @Body() updateDto: UpdatePatrolScheduleDto) {
    return this.schedulesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA, Role.KEPALA_DESA, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT)
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }

  @Post(':id/start')
  @Roles(Role.PETUGAS_RONDA, Role.KETUA_RT, Role.ADMIN_RT)
  startPatrol(@Param('id') id: string) {
    return this.schedulesService.startPatrol(id);
  }

  @Post(':id/complete')
  @Roles(Role.PETUGAS_RONDA, Role.KETUA_RT, Role.ADMIN_RT)
  completePatrol(@Param('id') id: string, @Body('reportSummary') reportSummary?: string) {
    return this.schedulesService.completePatrol(id, reportSummary);
  }

  @Post(':id/cancel')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT)
  cancelPatrol(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.schedulesService.cancelPatrol(id, reason);
  }
}
