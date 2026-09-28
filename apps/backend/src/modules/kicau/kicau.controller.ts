import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { KicauService, KICAU_MODERATOR_ROLES } from './kicau.service';
import { CreateKicauPostDto, CreateKicauCommentDto, HideKicauPostDto } from './dto/kicau.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { s3Storage } from '../../common/services/s3-storage';

const kicauStorage = s3Storage('kicau');

const imageFilter = (_req: any, file: any, cb: any) => {
  if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (jpg, png, webp) yang diizinkan'), false);
  }
};

@ApiTags('kicau')
@Controller('kicau')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class KicauController {
  constructor(private readonly service: KicauService) {}

  @Get()
  @ApiOperation({ summary: 'Feed Kicau Desa untuk desa pengguna' })
  getFeed(@Query() query: any, @CurrentUser() user: any) {
    return this.service.getFeed(query, user);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('fotos', 4, {
      storage: kicauStorage,
      fileFilter: imageFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateKicauPostDto,
    @CurrentUser() user: any,
  ) {
    const fotoUrls = (files || []).map((f) => (f as any).location).filter(Boolean);
    return this.service.create(dto, fotoUrls, user);
  }

  @Post(':id/like')
  toggleLike(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.toggleLike(id, user);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string, @Query() query: any, @CurrentUser() user: any) {
    return this.service.getComments(id, query, user);
  }

  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body() dto: CreateKicauCommentDto, @CurrentUser() user: any) {
    return this.service.addComment(id, dto, user);
  }

  @Delete('comments/:commentId')
  removeComment(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    return this.service.removeComment(commentId, user);
  }

  @Delete(':id')
  removePost(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.removePost(id, user);
  }

  @Patch(':id/hide')
  @Roles(...KICAU_MODERATOR_ROLES)
  hidePost(@Param('id') id: string, @Body() dto: HideKicauPostDto, @CurrentUser() user: any) {
    return this.service.hidePost(id, dto, user);
  }
}
