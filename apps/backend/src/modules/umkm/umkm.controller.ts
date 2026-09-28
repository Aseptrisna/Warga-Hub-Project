import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UmkmService, UMKM_ADMIN_ROLES } from './umkm.service';
import { CreateUmkmDto, UpdateUmkmDto, ReviewUmkmDto } from './dto/umkm.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { s3Storage } from '../../common/services/s3-storage';

const imageFilter = (_req: any, file: any, cb: any) => {
  if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) cb(null, true);
  else cb(new Error('Hanya file gambar (jpg, png, webp) yang diizinkan'), false);
};

@ApiTags('umkm')
@Controller('umkm')
export class UmkmPublicController {
  constructor(private readonly service: UmkmService) {}

  @Get('public')
  @ApiOperation({ summary: 'Public directory of approved UMKM for a desa' })
  findPublic(@Query() query: any) {
    return this.service.findPublic(query);
  }
}

@ApiTags('umkm')
@Controller('umkm')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UmkmController {
  constructor(private readonly service: UmkmService) {}

  @Post()
  create(@Body() dto: CreateUmkmDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Get('my')
  findMine(@CurrentUser() user: any) {
    return this.service.findMine(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUmkmDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user);
  }

  @Post(':id/foto')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { storage: s3Storage('umkm'), fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  uploadFoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.service.setFoto(id, (file as any)?.location, user);
  }

  @Patch(':id/review')
  @Roles(...UMKM_ADMIN_ROLES)
  review(@Param('id') id: string, @Body() dto: ReviewUmkmDto, @CurrentUser() user: any) {
    return this.service.review(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }
}
