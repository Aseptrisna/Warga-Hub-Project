import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const ACTIVATION_ROLES = [
  Role.KETUA_RT, Role.ADMIN_RT,
  Role.KETUA_RW, Role.ADMIN_RW,
  Role.ADMIN_DESA,
  Role.KEPALA_DESA, Role.SEKRETARIS_DESA,
  Role.SUPER_ADMIN, Role.ADMIN_PLATFORM,
];

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA)
  create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Get('statistics')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA)
  getStatistics(@CurrentUser() user: any) {
    return this.service.getStatistics(user);
  }

  @Get('pending-activation')
  @Roles(...ACTIVATION_ROLES)
  getPendingActivation(@Query() query: any, @CurrentUser() user: any) {
    return this.service.getPendingActivation(query, user);
  }

  @Post(':id/activate')
  @Roles(...ACTIVATION_ROLES)
  activateWarga(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.activateWarga(id, user);
  }

  @Post(':id/reject-activation')
  @Roles(...ACTIVATION_ROLES)
  rejectWargaActivation(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.service.rejectWargaActivation(id, user, body.reason);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA, Role.SEKRETARIS_DESA)
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA, Role.SEKRETARIS_DESA)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/role')
  @Roles(Role.SUPER_ADMIN)
  changeRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.service.changeRole(id, role);
  }

  @Patch(':id/toggle-active')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA)
  toggleActive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.toggleActive(id, user);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_DESA)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }
}
