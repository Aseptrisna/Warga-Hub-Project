import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Length, IsBoolean, IsNumber } from 'class-validator';

export class CreateFamilyDto {
  @ApiProperty({ example: '3273011234567890', description: 'Nomor KK 16 digit' })
  @IsString()
  @Length(16, 16, { message: 'No KK harus 16 digit' })
  noKk: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  kepalaKeluargaId?: string;

  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  kepalaKeluargaNama: string;

  @ApiProperty({ example: 'Jl. Merdeka No. 123' })
  @IsString()
  alamat: string;

  @ApiProperty({ example: '001' })
  @IsString()
  rt: string;

  @ApiProperty({ example: '001' })
  @IsString()
  rw: string;

  @ApiProperty({ example: 'Desa Sukamaju' })
  @IsString()
  desa: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  kecamatan?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  kabupaten?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  provinsi?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  regionId?: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  jumlahAnggota?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
