import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

/** The self-service subset of Citizen fields a warga may edit on their own profile. */
export class UpdateMyProfileDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() noTelp?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsEmail() email?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() alamat?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() npwp?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() noBpjsKesehatan?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() noBpjsKetenagakerjaan?: string;
}
