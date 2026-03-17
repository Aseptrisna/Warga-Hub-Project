import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GuestbookService } from './guestbook.service';
import { CreateGuestbookEntryDto } from './dto/create-guestbook-entry.dto';
import { UpdateGuestbookEntryDto } from './dto/update-guestbook-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getRegionScope } from '../../common/helpers/region-scope.helper';

@ApiTags('guestbook')
@Controller('guestbook')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GuestbookController {
  constructor(private readonly guestbookService: GuestbookService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_RT, Role.KETUA_RT, Role.KAUR_UMUM, Role.KASI_PELAYANAN, Role.ADMIN_RW, Role.KETUA_RW)
  @ApiOperation({ summary: 'Create new guestbook entry' })
  create(@Body() createDto: CreateGuestbookEntryDto, @CurrentUser() user: any) {
    return this.guestbookService.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all guestbook entries with pagination and filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.guestbookService.findAll({ ...query, ...scope });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get guestbook statistics' })
  getStatistics(@Query() filter: any, @CurrentUser() user: any) {
    const scope = getRegionScope(user);
    return this.guestbookService.getStatistics({ ...filter, ...scope });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get guestbook entry by ID' })
  findOne(@Param('id') id: string) {
    return this.guestbookService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_RT, Role.KETUA_RT, Role.KAUR_UMUM, Role.KASI_PELAYANAN, Role.ADMIN_RW, Role.KETUA_RW)
  @ApiOperation({ summary: 'Update guestbook entry' })
  update(@Param('id') id: string, @Body() updateDto: UpdateGuestbookEntryDto, @CurrentUser() user: any) {
    return this.guestbookService.update(id, updateDto);
  }

  @Patch(':id/checkout')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_RT, Role.KETUA_RT, Role.KAUR_UMUM, Role.KASI_PELAYANAN, Role.ADMIN_RW, Role.KETUA_RW)
  @ApiOperation({ summary: 'Checkout guest (mark as Keluar)' })
  checkout(@Param('id') id: string, @CurrentUser() user: any) {
    return this.guestbookService.checkout(id, user);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_RT, Role.KETUA_RT)
  @ApiOperation({ summary: 'Delete guestbook entry' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.guestbookService.remove(id);
  }
}
