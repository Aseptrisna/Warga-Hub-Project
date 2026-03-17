import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsOptional, IsEnum, Min } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Pembelian ATK kantor desa' })
  @IsString()
  keterangan: string;

  @ApiProperty({ enum: ['Operasional', 'Infrastruktur', 'Kegiatan', 'Sosial', 'Pendidikan', 'Kesehatan', 'Keamanan', 'Lainnya'] })
  @IsEnum(['Operasional', 'Infrastruktur', 'Kegiatan', 'Sosial', 'Pendidikan', 'Kesehatan', 'Keamanan', 'Lainnya'])
  kategori: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(0)
  jumlah: number;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z' })
  @IsDateString()
  tanggalPengeluaran: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  penerimaNama?: string;

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
