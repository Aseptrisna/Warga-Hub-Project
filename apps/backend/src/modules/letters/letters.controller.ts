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
  Request,
} from '@nestjs/common';
import { LettersService } from './letters.service';
import { CreateLetterDto } from './dto/create-letter.dto';
import { ApproveLetterDto, RejectLetterDto } from './dto/approve-letter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { LetterStatus } from './schemas/letter.schema';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getRegionScope } from '../../common/helpers/region-scope.helper';

@Controller('letters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LettersController {
  constructor(private readonly lettersService: LettersService) {}

  @Get('my')
  getMyLetters(
    @Query('status') status?: LetterStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any,
  ) {
    return this.lettersService.findAll({
      requestedBy: user?.id,
      status,
      page,
      limit,
    });
  }

  @Post()
  create(@Body() createDto: CreateLetterDto, @Request() req: any) {
    return this.lettersService.create(createDto, req.user);
  }

  @Get()
  findAll(
    @Query('status') status?: LetterStatus,
    @Query('templateId') templateId?: string,
    @Query('requestedBy') requestedBy?: string,
    @Query('regionId') regionId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any,
  ) {
    const scope = getRegionScope(user);
    return this.lettersService.findAll({
      status,
      templateId,
      requestedBy,
      regionId,
      search,
      page,
      limit,
      ...scope,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lettersService.findOne(id);
  }

  @Patch(':id/approve-rt')
  @Roles(Role.KETUA_RT, Role.ADMIN_RT)
  approveByRT(
    @Param('id') id: string,
    @Body() dto: ApproveLetterDto,
    @Request() req: any,
  ) {
    return this.lettersService.approveByRT(id, req.user, dto);
  }

  @Patch(':id/approve-rw')
  @Roles(Role.KETUA_RW, Role.ADMIN_RW)
  approveByRW(
    @Param('id') id: string,
    @Body() dto: ApproveLetterDto,
    @Request() req: any,
  ) {
    return this.lettersService.approveByRW(id, req.user, dto);
  }

  @Patch(':id/approve-desa')
  @Roles(
    Role.KEPALA_DESA,
    Role.SEKRETARIS_DESA,
    Role.KASI_PEMERINTAHAN,
    Role.KASI_PELAYANAN,
  )
  approveByDesa(
    @Param('id') id: string,
    @Body() dto: ApproveLetterDto,
    @Request() req: any,
  ) {
    return this.lettersService.approveByDesa(id, req.user, dto);
  }

  @Patch(':id/reject')
  @Roles(
    Role.KETUA_RT,
    Role.ADMIN_RT,
    Role.KETUA_RW,
    Role.ADMIN_RW,
    Role.KEPALA_DESA,
    Role.SEKRETARIS_DESA,
  )
  reject(
    @Param('id') id: string,
    @Body() dto: RejectLetterDto,
    @Request() req: any,
  ) {
    return this.lettersService.reject(id, req.user, dto);
  }

  @Post(':id/generate-pdf')
  @Roles(Role.SUPER_ADMIN, Role.KEPALA_DESA)
  generatePDF(@Param('id') id: string) {
    return this.lettersService.generatePDF(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.lettersService.remove(id, req.user);
  }
}
