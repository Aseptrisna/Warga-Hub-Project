import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getRegionScope } from '../../common/helpers/region-scope.helper';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary statistics' })
  getSummary(@CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.dashboardService.getSummary(scope);
  }

  @Get('charts')
  @ApiOperation({ summary: 'Get chart data for dashboard' })
  @ApiQuery({ name: 'period', required: false, enum: ['weekly', 'monthly', 'yearly'] })
  getChartData(@Query('period') period?: string, @CurrentUser() user?: any) {
    const scope = getRegionScope(user);
    return this.dashboardService.getChartData(period, scope);
  }
}
