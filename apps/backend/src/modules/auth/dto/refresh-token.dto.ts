import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
  })
  @IsString({ message: 'Refresh token wajib diisi' })
  refreshToken: string;
}
