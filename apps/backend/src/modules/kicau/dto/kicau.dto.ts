import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateKicauPostDto {
  @ApiProperty({ required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Kicauan maksimal 500 karakter' })
  isi?: string;
}

export class CreateKicauCommentDto {
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MinLength(1, { message: 'Komentar tidak boleh kosong' })
  @MaxLength(300, { message: 'Komentar maksimal 300 karakter' })
  isi: string;
}

export class HideKicauPostDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MinLength(1, { message: 'Alasan wajib diisi' })
  @MaxLength(255)
  reason: string;
}
