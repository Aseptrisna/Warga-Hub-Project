import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsDateString, IsOptional, Length, Matches, IsBoolean } from 'class-validator';

export class CreateCitizenDto {
  @ApiProperty({ example: '3201234567890123', description: 'NIK 16 digit' })
  @IsString()
  @Length(16, 16, { message: 'NIK harus 16 digit' })
  @Matches(/^\d{16}$/, { message: 'NIK harus berupa angka 16 digit' })
  nik: string;

  @ApiProperty({ example: '3201234567890123', description: 'Nomor KK 16 digit' })
  @IsString()
  @Length(16, 16, { message: 'No KK harus 16 digit' })
  noKk: string;

  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  namaLengkap: string;

  @ApiProperty({ enum: ['Laki-laki', 'Perempuan'] })
  @IsEnum(['Laki-laki', 'Perempuan'])
  jenisKelamin: string;

  @ApiProperty({ example: 'Jakarta' })
  @IsString()
  tempatLahir: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsDateString()
  tanggalLahir: Date;

  @ApiProperty({ enum: ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'] })
  @IsEnum(['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'])
  agama: string;

  @ApiProperty({ example: 'S1' })
  @IsString()
  pendidikan: string;

  @ApiProperty({ example: 'Karyawan Swasta', required: false })
  @IsOptional()
  @IsString()
  pekerjaan?: string;

  @ApiProperty({ enum: ['Kawin', 'Belum Kawin', 'Cerai Hidup', 'Cerai Mati'] })
  @IsEnum(['Kawin', 'Belum Kawin', 'Cerai Hidup', 'Cerai Mati'])
  statusPerkawinan: string;

  @ApiProperty({ enum: ['Kepala Keluarga', 'Istri', 'Anak', 'Orang Tua', 'Mertua', 'Famili Lain', 'Pembantu', 'Lainnya'] })
  @IsEnum(['Kepala Keluarga', 'Istri', 'Anak', 'Orang Tua', 'Mertua', 'Famili Lain', 'Pembantu', 'Lainnya'])
  statusHubunganDalamKeluarga: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  namaAyah?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  namaIbu?: string;

  @ApiProperty({ example: 'Jl. Merdeka No. 123' })
  @IsString()
  alamat: string;

  @ApiProperty({ example: '01' })
  @IsString()
  rt: string;

  @ApiProperty({ example: '02' })
  @IsString()
  rw: string;

  @ApiProperty({ example: 'Sukamaju' })
  @IsString()
  desa: string;

  @ApiProperty({ example: 'Bandung', required: false })
  @IsOptional()
  @IsString()
  kecamatan?: string;

  @ApiProperty({ example: 'Bandung', required: false })
  @IsOptional()
  @IsString()
  kabupaten?: string;

  @ApiProperty({ example: 'Jawa Barat', required: false })
  @IsOptional()
  @IsString()
  provinsi?: string;

  @ApiProperty({ example: '40123', required: false })
  @IsOptional()
  @IsString()
  kodePos?: string;

  @ApiProperty({ example: '081234567890', required: false })
  @IsOptional()
  @IsString()
  noTelp?: string;

  @ApiProperty({ example: 'budi@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, enum: ['WNI', 'WNA'] })
  @IsOptional()
  @IsString()
  kewarganegaraan?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  golonganDarah?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nomorPaspor?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nomorAktaLahir?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  npwp?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  statusKepemilikanRumah?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  statusKependudukan?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  noBpjsKesehatan?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  noBpjsKetenagakerjaan?: string;

  @ApiProperty({ default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keterangan?: string;
}
