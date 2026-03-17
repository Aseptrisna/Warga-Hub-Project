import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PatrolLogsService } from './patrol-logs.service';
import { ScanCheckpointDto } from './dto/scan-checkpoint.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ScanStatus } from './schemas/patrol-log.schema';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getRegionScope } from '../../common/helpers/region-scope.helper';

@Controller('patrol-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatrolLogsController {
  constructor(private readonly logsService: PatrolLogsService) {}

  @Post('scan')
  @Roles(Role.PETUGAS_RONDA, Role.KETUA_RT, Role.ADMIN_RT)
  async scanCheckpoint(@Body() scanDto: ScanCheckpointDto, @Request() req: any) {
    return this.logsService.scanCheckpoint(scanDto, req.user);
  }

  @Get()
  findAll(
    @Query('scheduleId') scheduleId?: string,
    @Query('checkpointId') checkpointId?: string,
    @Query('scannedBy') scannedBy?: string,
    @Query('status') status?: ScanStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: any,
  ) {
    const scope = getRegionScope(user);
    return this.logsService.findAll({
      scheduleId,
      checkpointId,
      scannedBy,
      status,
      startDate,
      endDate,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      ...scope,
    });
  }

  @Get('statistics')
  getStatistics(
    @Query('scheduleId') scheduleId?: string,
    @Query('checkpointId') checkpointId?: string,
    @Query('officerId') officerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    const scope = getRegionScope(user);
    return this.logsService.getStatistics({
      scheduleId,
      checkpointId,
      officerId,
      startDate,
      endDate,
      ...scope,
    });
  }

  @Get('schedule/:scheduleId')
  getScheduleLogs(@Param('scheduleId') scheduleId: string) {
    return this.logsService.getScheduleLogs(scheduleId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.logsService.findOne(id);
  }
}
