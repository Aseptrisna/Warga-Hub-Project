import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsDateString, IsNumber, Min } from 'class-validator';
import { EventCategory, EventStatus } from '../schemas/event.schema';

export class UpdateEventDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() namaAcara?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() deskripsi?: string;

  @ApiProperty({ required: false, enum: EventCategory })
  @IsOptional()
  @IsIn(Object.values(EventCategory))
  kategori?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsDateString() tanggalMulai?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() tanggalSelesai?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() lokasi?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) kapasitas?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() gambar?: string;

  @ApiProperty({ required: false, enum: EventStatus })
  @IsOptional()
  @IsIn(Object.values(EventStatus))
  status?: string;
}
