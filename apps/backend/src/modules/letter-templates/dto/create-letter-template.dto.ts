import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class CreateLetterTemplateDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredFields?: string[];

  @IsOptional()
  styles?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  regionId?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
