import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ArrayMinSize, IsEnum, Matches, MaxLength, MinLength } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class CreateCustomRoleDto {
  @ApiProperty({ example: 'bendahara-tambahan', description: 'Unique slug, lowercase-with-dashes' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, { message: 'Kode role hanya boleh huruf kecil, angka, dan tanda strip' })
  code: string;

  @ApiProperty({ example: 'Bendahara Tambahan' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  label: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ enum: Role, isArray: true, description: 'Existing roles whose API access this role inherits' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Pilih minimal 1 role dasar' })
  @IsEnum(Role, { each: true, message: 'Role dasar tidak valid' })
  baseRoles: Role[];

  @ApiProperty({ type: [String], description: 'Sidebar menu paths this role can see' })
  @IsArray()
  @IsString({ each: true })
  menuPaths: string[];
}
