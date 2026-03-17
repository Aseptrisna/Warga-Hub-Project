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
import { LetterTemplatesService } from './letter-templates.service';
import { CreateLetterTemplateDto } from './dto/create-letter-template.dto';
import { UpdateLetterTemplateDto } from './dto/update-letter-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('letter-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LetterTemplatesController {
  constructor(private readonly letterTemplatesService: LetterTemplatesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.KEPALA_DESA, Role.SEKRETARIS_DESA)
  create(@Body() createDto: CreateLetterTemplateDto, @Request() req: any) {
    return this.letterTemplatesService.create(createDto, req.user.id);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('regionId') regionId?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.letterTemplatesService.findAll({
      search,
      regionId,
      isActive: isActive === 'true',
      page,
      limit,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.letterTemplatesService.findOne(id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.letterTemplatesService.findByCode(code);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.KEPALA_DESA, Role.SEKRETARIS_DESA)
  update(@Param('id') id: string, @Body() updateDto: UpdateLetterTemplateDto) {
    return this.letterTemplatesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.letterTemplatesService.remove(id);
  }
}
