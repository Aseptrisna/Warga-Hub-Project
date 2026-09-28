import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class GenerateBulkDto {
  @ApiProperty() @IsNumber() @Min(1) @Max(12) bulan: number;
  @ApiProperty() @IsNumber() tahun: number;
}
