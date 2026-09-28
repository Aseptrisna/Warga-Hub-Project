import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsArray, IsObject } from 'class-validator';
import { ReportCategory } from '../schemas/report.schema';

export class CreateReportDto {
  @ApiProperty() @IsString() judul: string;

  @ApiProperty({ enum: ReportCategory })
  @IsIn(Object.values(ReportCategory))
  kategori: string;

  @ApiProperty() @IsString() deskripsi: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fotoUrls?: string[];

  @ApiProperty({ required: false, type: Object, description: '{ alamat?, lat?, lng? }' })
  @IsOptional()
  @IsObject()
  lokasi?: { alamat?: string; lat?: number; lng?: number };
}
