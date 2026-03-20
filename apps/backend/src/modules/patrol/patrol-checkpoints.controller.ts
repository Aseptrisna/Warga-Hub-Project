import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { PatrolCheckpointsService } from './patrol-checkpoints.service';
import { CreatePatrolCheckpointDto, UpdatePatrolCheckpointDto } from './dto/create-patrol-checkpoint.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getRegionScope } from '../../common/helpers/region-scope.helper';

@Controller('patrol-checkpoints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatrolCheckpointsController {
  constructor(private readonly checkpointsService: PatrolCheckpointsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT)
  create(@Body() createDto: CreatePatrolCheckpointDto, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.checkpointsService.create({ ...createDto, ...scope });
  }

  @Get()
  findAll(
    @Query('regionId') regionId?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: any,
  ) {
    const scope = getRegionScope(user);
    return this.checkpointsService.findAll({
      regionId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      ...scope,
    });
  }

  @Get('nearby')
  findNearby(
    @Query('longitude') longitude: string,
    @Query('latitude') latitude: string,
    @Query('maxDistance') maxDistance?: string,
  ) {
    return this.checkpointsService.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      maxDistance ? parseInt(maxDistance) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checkpointsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA, Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT)
  update(@Param('id') id: string, @Body() updateDto: UpdatePatrolCheckpointDto) {
    return this.checkpointsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA, Role.KEPALA_DESA, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT)
  remove(@Param('id') id: string) {
    return this.checkpointsService.remove(id);
  }

  @Post(':id/regenerate-qr')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA, Role.KEPALA_DESA, Role.KETUA_RW, Role.ADMIN_RW, Role.KETUA_RT, Role.ADMIN_RT)
  regenerateQR(@Param('id') id: string) {
    return this.checkpointsService.regenerateQRCode(id);
  }
}
