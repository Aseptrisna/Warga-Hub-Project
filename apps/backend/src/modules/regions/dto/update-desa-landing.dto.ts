import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsObject, MaxLength } from 'class-validator';

export class UpdateDesaLandingDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(150) heroTitle?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(300) heroSubtitle?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(3000) aboutText?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({ required: false }) @IsOptional() @IsString() contactPhone?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() contactEmail?: string;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  socialMedia?: Record<string, string>;
}
