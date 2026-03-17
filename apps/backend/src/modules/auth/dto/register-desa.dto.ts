import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDesaDto {
  // ── Data Admin ──
  @ApiProperty({ example: 'Admin Desa Sukamaju', description: 'Nama admin desa' })
  @IsString()
  @MinLength(3, { message: 'Nama minimal 3 karakter' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  name: string;

  @ApiProperty({ example: 'admin@desasukamaju.id', description: 'Email admin' })
  @IsEmail({}, { message: 'Email tidak valid' })
  email: string;

  @ApiPropertyOptional({ example: '081234567890', description: 'No. telp admin' })
  @IsOptional()
  @IsString()
  @Matches(/^(\+62|62|0)[0-9]{9,12}$/, {
    message: 'Nomor telepon tidak valid (contoh: 081234567890)',
  })
  phone?: string;

  @ApiProperty({ example: 'Admin123!', description: 'Password (min 8, upper+lower+digit)' })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(50, { message: 'Password maksimal 50 karakter' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
  })
  password: string;

  // ── Data Desa ──
  @ApiProperty({ example: 'Desa Sukamaju', description: 'Nama desa' })
  @IsString()
  @MinLength(3, { message: 'Nama desa minimal 3 karakter' })
  @MaxLength(100, { message: 'Nama desa maksimal 100 karakter' })
  desaName: string;

  @ApiPropertyOptional({ example: 'Baleendah' })
  @IsOptional()
  @IsString()
  kecamatan?: string;

  @ApiPropertyOptional({ example: 'Bandung' })
  @IsOptional()
  @IsString()
  kabupaten?: string;

  @ApiPropertyOptional({ example: 'Jawa Barat' })
  @IsOptional()
  @IsString()
  provinsi?: string;

  @ApiPropertyOptional({ example: 'Jl. Raya Sukamaju No.100' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '40375' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: '(022) 5940456', description: 'Kontak desa' })
  @IsOptional()
  @IsString()
  desaPhone?: string;

  @ApiPropertyOptional({ example: 'desa@sukamaju.id', description: 'Email desa' })
  @IsOptional()
  @IsEmail({}, { message: 'Email desa tidak valid' })
  desaEmail?: string;

  @ApiPropertyOptional({ example: 'H. Suharto, S.Sos', description: 'Nama kepala desa' })
  @IsOptional()
  @IsString()
  leaderName?: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'Email verification token' })
  @IsString()
  token: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'admin@desasukamaju.id' })
  @IsEmail({}, { message: 'Email tidak valid' })
  email: string;
}
