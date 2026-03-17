import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';

@ApiTags('audit')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA)
  @ApiOperation({ summary: 'Get all audit logs (admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'module', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(@Query() query: any) {
    return this.auditService.findAll(query);
  }

  @Get('statistics')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA)
  @ApiOperation({ summary: 'Get audit log statistics' })
  getStatistics() {
    return this.auditService.getStatistics();
  }
}
