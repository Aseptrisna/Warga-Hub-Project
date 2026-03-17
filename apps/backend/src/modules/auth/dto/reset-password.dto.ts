import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Reset password token from email',
  })
  @IsString({ message: 'Token wajib diisi' })
  token: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: 'New password',
  })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(50, { message: 'Password maksimal 50 karakter' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
  })
  newPassword: string;
}
