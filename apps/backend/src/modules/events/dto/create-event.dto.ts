import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsDateString, IsNumber, Min } from 'class-validator';
import { EventCategory } from '../schemas/event.schema';

export class CreateEventDto {
  @ApiProperty() @IsString() namaAcara: string;
  @ApiProperty() @IsString() deskripsi: string;

  @ApiProperty({ enum: EventCategory })
  @IsIn(Object.values(EventCategory))
  kategori: string;

  @ApiProperty() @IsDateString() tanggalMulai: string;
  @ApiProperty() @IsDateString() tanggalSelesai: string;
  @ApiProperty() @IsString() lokasi: string;

  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) kapasitas?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() gambar?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() desa?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() rw?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() rt?: string;
}
