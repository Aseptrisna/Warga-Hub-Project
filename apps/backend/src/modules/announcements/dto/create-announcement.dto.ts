import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty() @IsString() judul: string;
  @ApiProperty() @IsString() isi: string;

  @ApiProperty({ enum: ['Umum', 'Penting', 'Mendesak'] })
  @IsIn(['Umum', 'Penting', 'Mendesak'])
  kategori: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() gambar?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() targetDesa?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() targetRW?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() targetRT?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isPinned?: boolean;
}
