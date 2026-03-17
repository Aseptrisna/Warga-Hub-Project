import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsEnum,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'john@example.com', description: 'User email' })
  @IsEmail({}, { message: 'Email tidak valid' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Password (min 6 chars)' })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  @MaxLength(50, { message: 'Password maksimal 50 karakter' })
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  @MinLength(3, { message: 'Nama minimal 3 karakter' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  name: string;

  @ApiProperty({ example: Role.WARGA, enum: Role, description: 'User role' })
  @IsEnum(Role, { message: 'Role tidak valid' })
  role: Role;

  @ApiProperty({ example: '081234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Desa Sukamaju', description: 'Village name' })
  @IsString({ message: 'Desa harus diisi' })
  desa: string;

  @ApiProperty({ example: '01', required: false })
  @IsOptional()
  @IsString()
  rw?: string;

  @ApiProperty({ example: '02', required: false })
  @IsOptional()
  @IsString()
  rt?: string;
}
