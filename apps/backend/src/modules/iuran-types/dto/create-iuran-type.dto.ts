import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min } from 'class-validator';

export class CreateIuranTypeDto {
  @ApiProperty({ example: 'Iuran Kebersihan' })
  @IsString()
  nama: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  jumlah: number;

  @ApiProperty({ enum: ['Bulanan', 'Tahunan', 'Insidental'] })
  @IsEnum(['Bulanan', 'Tahunan', 'Insidental'])
  periode: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keterangan?: string;

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

  @ApiProperty({ enum: ['desa', 'rw', 'rt'] })
  @IsEnum(['desa', 'rw', 'rt'])
  scopeLevel: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
