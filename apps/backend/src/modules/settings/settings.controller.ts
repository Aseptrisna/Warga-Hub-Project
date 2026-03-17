import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM)
  findAll(@Query('category') category?: string) {
    return this.service.findAll(category);
  }

  @Patch()
  @Roles(Role.SUPER_ADMIN)
  bulkUpdate(@Body() body: { updates: { key: string; value: string }[] }) {
    return this.service.bulkUpdate(body.updates);
  }
}
