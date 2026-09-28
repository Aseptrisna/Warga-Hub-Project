import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Nama minimal 3 karakter' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  name?: string;

  @ApiProperty({ example: '081234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: Role.WARGA, required: false, description: 'Built-in Role enum value, or a custom role code' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ example: 'Desa Sukamaju', required: false })
  @IsOptional()
  @IsString()
  desa?: string;

  @ApiProperty({ example: '01', required: false })
  @IsOptional()
  @IsString()
  rw?: string;

  @ApiProperty({ example: '02', required: false })
  @IsOptional()
  @IsString()
  rt?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
