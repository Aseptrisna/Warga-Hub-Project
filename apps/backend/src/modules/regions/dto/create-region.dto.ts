import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { RegionType } from '../schemas/region.schema';

export class CreateRegionDto {
  @IsString()
  name: string;

  @IsEnum(RegionType)
  type: RegionType;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  provinsi?: string;

  @IsOptional()
  @IsString()
  kabupaten?: string;

  @IsOptional()
  @IsString()
  kecamatan?: string;

  @IsOptional()
  @IsString()
  desa?: string;

  @IsOptional()
  @IsString()
  rw?: string;

  @IsOptional()
  @IsString()
  rt?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  leaderName?: string;

  @IsOptional()
  @IsString()
  leaderPhone?: string;

  @IsOptional()
  @IsNumber()
  totalCitizens?: number;

  @IsOptional()
  @IsNumber()
  totalFamilies?: number;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsString()
  subdomain?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}
