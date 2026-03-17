import { IsString, IsOptional } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  @IsOptional()
  value?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
