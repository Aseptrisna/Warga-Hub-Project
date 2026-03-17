import { IsString, IsOptional } from 'class-validator';

export class ApproveLetterDto {
  @IsOptional()
  @IsString()
  notes?: string; // Optional approval notes
}

export class RejectLetterDto {
  @IsString()
  reason: string; // Required rejection reason
}
