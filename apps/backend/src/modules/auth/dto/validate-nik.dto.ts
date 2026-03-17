import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ValidateNikDto {
  @ApiProperty({
    example: '3201234567890001',
    description: 'NIK (16 digit)',
  })
  @IsString()
  @Matches(/^[0-9]{16}$/, { message: 'NIK harus 16 digit angka' })
  nik: string;
}
