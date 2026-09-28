import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomRolesService } from './custom-roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCustomRoleDto } from './dto/create-custom-role.dto';
import { UpdateCustomRoleDto } from './dto/update-custom-role.dto';

@ApiTags('custom-roles')
@Controller('custom-roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomRolesController {
  constructor(private readonly service: CustomRolesService) {}

  @Get('my-menu')
  @ApiOperation({ summary: 'Get current user menu access if they hold a custom role (null = built-in, use static config)' })
  async getMyMenu(@CurrentUser() user: any) {
    return await this.service.getMenuInfo(user.role);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM)
  @ApiOperation({ summary: 'List all custom roles' })
  findAll(): Promise<Array<Record<string, any>>> {
    return this.service.findAll();
  }

  @Get(':code')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM)
  findOne(@Param('code') code: string) {
    return this.service.findOne(code);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM)
  @ApiOperation({ summary: 'Create a custom role' })
  create(@Body() dto: CreateCustomRoleDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Patch(':code')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM)
  update(@Param('code') code: string, @Body() dto: UpdateCustomRoleDto, @CurrentUser() user: any) {
    return this.service.update(code, dto, user);
  }

  @Delete(':code')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_PLATFORM)
  remove(@Param('code') code: string, @CurrentUser() user: any) {
    return this.service.remove(code, user);
  }
}
