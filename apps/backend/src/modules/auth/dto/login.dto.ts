import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Email tidak valid' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password',
  })
  @IsString()
  @MinLength(1, { message: 'Password wajib diisi' })
  password: string;
}
