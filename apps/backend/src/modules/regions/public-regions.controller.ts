import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { RegionType } from './schemas/region.schema';

@ApiTags('public-regions')
@Controller('public/regions')
export class PublicRegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get('desa')
  @ApiOperation({ summary: 'Get all Desa (public, no auth required)' })
  getDesa() {
    return this.regionsService.findAll({ type: RegionType.DESA, limit: 100 });
  }

  @Get('landing/:subdomain')
  @ApiOperation({ summary: 'Get public landing page data for a desa by subdomain' })
  getDesaLanding(@Param('subdomain') subdomain: string) {
    return this.regionsService.getPublicLanding(subdomain);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get children of a region (public, no auth required)' })
  getChildren(@Param('id') id: string) {
    return this.regionsService.getChildren(id);
  }
}
