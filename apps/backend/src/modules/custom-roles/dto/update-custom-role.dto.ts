import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ArrayMinSize, IsEnum, MaxLength, MinLength, IsBoolean } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class UpdateCustomRoleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  label?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ enum: Role, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Pilih minimal 1 role dasar' })
  @IsEnum(Role, { each: true, message: 'Role dasar tidak valid' })
  baseRoles?: Role[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  menuPaths?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
