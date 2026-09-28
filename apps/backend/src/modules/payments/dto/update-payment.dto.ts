import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsIn, Min, Max, IsDateString } from 'class-validator';

export class UpdatePaymentDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() iuranTypeName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) jumlah?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) jumlahDibayar?: number;

  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(1) @Max(12) bulan?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() tahun?: number;

  @ApiProperty({ required: false, enum: ['Belum Bayar', 'Menunggu Verifikasi', 'Lunas', 'Ditolak'] })
  @IsOptional()
  @IsIn(['Belum Bayar', 'Menunggu Verifikasi', 'Lunas', 'Ditolak'])
  status?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsDateString() tanggalBayar?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() metodeBayar?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() keterangan?: string;
}
