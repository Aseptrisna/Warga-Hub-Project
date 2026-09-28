import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class UpdateAnnouncementDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() judul?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() isi?: string;

  @ApiProperty({ required: false, enum: ['Umum', 'Penting', 'Mendesak'] })
  @IsOptional()
  @IsIn(['Umum', 'Penting', 'Mendesak'])
  kategori?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() gambar?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() targetDesa?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() targetRW?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() targetRT?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isPinned?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isActive?: boolean;
}
