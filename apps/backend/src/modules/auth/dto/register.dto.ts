import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: '3201234567890001',
    description: 'NIK (16 digit)',
  })
  @IsString()
  @Matches(/^[0-9]{16}$/, { message: 'NIK harus 16 digit angka' })
  nik: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Email tidak valid' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password (min 8 characters, must include uppercase, lowercase, number)',
  })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(50, { message: 'Password maksimal 50 karakter' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
  })
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsString()
  @MinLength(3, { message: 'Nama minimal 3 karakter' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  name: string;

  @ApiProperty({
    example: '081234567890',
    description: 'Phone number (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^(\+62|62|0)[0-9]{9,12}$/, {
    message: 'Nomor telepon tidak valid (contoh: 081234567890)',
  })
  phone?: string;
}
