import { IsString, IsObject, IsOptional } from 'class-validator';

export class CreateLetterDto {
  @IsString()
  templateId: string;

  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  regionId?: string;

  @IsObject()
  data: Record<string, any>; // Dynamic fields based on template

  @IsOptional()
  metadata?: Record<string, any>;
}
