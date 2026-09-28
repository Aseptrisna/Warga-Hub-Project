import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsIn, Min, Max } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty() @IsString() citizenId: string;
  @ApiProperty() @IsString() citizenName: string;
  @ApiProperty() @IsString() nik: string;
  @ApiProperty() @IsString() rt: string;
  @ApiProperty() @IsString() rw: string;
  @ApiProperty() @IsString() desa: string;

  @ApiProperty() @IsString() iuranTypeId: string;
  @ApiProperty() @IsString() iuranTypeName: string;
  @ApiProperty() @IsNumber() @Min(0) jumlah: number;

  @ApiProperty() @IsNumber() @Min(1) @Max(12) bulan: number;
  @ApiProperty() @IsNumber() tahun: number;

  @ApiProperty({ required: false, description: 'Legacy field, kept for backward compatibility' })
  @IsOptional() @IsString() jenis?: string;

  @ApiProperty({ required: false, enum: ['Belum Bayar', 'Menunggu Verifikasi', 'Lunas', 'Ditolak'] })
  @IsOptional()
  @IsIn(['Belum Bayar', 'Menunggu Verifikasi', 'Lunas', 'Ditolak'])
  status?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() keterangan?: string;
}
