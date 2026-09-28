import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { UMKM_KATEGORI } from '../schemas/umkm.schema';

const WA_PATTERN = /^(\+?62|0)8[0-9]{7,12}$/;

export class CreateUmkmDto {
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(100) nama: string;

  @ApiProperty({ enum: UMKM_KATEGORI }) @IsIn(UMKM_KATEGORI as unknown as string[]) kategori: string;

  @ApiProperty() @IsString() @MinLength(10) @MaxLength(1000) deskripsi: string;

  @ApiProperty() @IsString() @MinLength(5) @MaxLength(255) alamat: string;

  @ApiProperty({ example: '081234567890' })
  @Matches(WA_PATTERN, { message: 'Nomor WhatsApp tidak valid (contoh: 081234567890)' })
  noWhatsapp: string;
}

export class UpdateUmkmDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MinLength(3) @MaxLength(100) nama?: string;

  @ApiProperty({ required: false, enum: UMKM_KATEGORI })
  @IsOptional()
  @IsIn(UMKM_KATEGORI as unknown as string[])
  kategori?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() @MinLength(10) @MaxLength(1000) deskripsi?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() @MinLength(5) @MaxLength(255) alamat?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(WA_PATTERN, { message: 'Nomor WhatsApp tidak valid (contoh: 081234567890)' })
  noWhatsapp?: string;
}

export class ReviewUmkmDto {
  @ApiProperty({ enum: ['Disetujui', 'Ditolak'] }) @IsIn(['Disetujui', 'Ditolak']) status: 'Disetujui' | 'Ditolak';

  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(255) rejectionReason?: string;
}
