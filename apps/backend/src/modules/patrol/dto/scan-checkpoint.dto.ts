import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class ScanCheckpointDto {
  @IsNotEmpty()
  @IsString()
  scheduleId: string;

  @IsNotEmpty()
  @IsString()
  checkpointId: string;

  @IsNotEmpty()
  @IsString()
  qrCodeData: string; // Scanned QR code data for validation

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  gpsAccuracy?: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string;
}
