import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address to send reset password link',
  })
  @IsEmail({}, { message: 'Email tidak valid' })
  email: string;
}
