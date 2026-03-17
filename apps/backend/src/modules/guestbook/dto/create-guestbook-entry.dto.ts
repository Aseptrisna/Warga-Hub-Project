import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateGuestbookEntryDto {
  @ApiProperty({ example: 'Ahmad Surya' })
  @IsString()
  namaTamu: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nik?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  noTelp?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  alamatAsal?: string;

  @ApiProperty({ example: 'Mengurus surat keterangan domisili' })
  @IsString()
  tujuan: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  yangDitemui?: string;

  @ApiProperty({ example: '2024-01-15T09:00:00.000Z' })
  @IsDateString()
  waktuMasuk: Date;

  @ApiProperty({ example: 'Desa Sukamaju' })
  @IsString()
  desa: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rw?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  regionId?: string;
}
