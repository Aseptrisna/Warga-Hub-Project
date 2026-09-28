import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { EmergencyType } from '../schemas/panic-alert.schema';

/**
 * Submitted as multipart/form-data (alongside the `foto` file), so every
 * field - including `lokasi` - arrives as a raw string; the controller
 * JSON.parses `lokasi` after validation.
 */
export class CreatePanicDto {
  @ApiProperty({ enum: EmergencyType })
  @IsIn(Object.values(EmergencyType))
  tipeEmergency: string;

  @ApiProperty({ required: false, description: 'JSON-encoded {alamat, lat, lng}' })
  @IsOptional()
  @IsString()
  lokasi?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() deskripsi?: string;
}
