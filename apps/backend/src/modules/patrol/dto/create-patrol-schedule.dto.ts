import { IsNotEmpty, IsString, IsEnum, IsArray, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { PatrolShift, PatrolStatus } from '../schemas/patrol-schedule.schema';

export class CreatePatrolScheduleDto {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsEnum(PatrolShift)
  shift: PatrolShift;

  @IsNotEmpty()
  @IsString()
  regionId: string;

  @IsOptional()
  @IsString()
  regionName?: string;

  @IsNotEmpty()
  @IsString()
  desa: string;

  @IsOptional()
  @IsString()
  rw?: string;

  @IsOptional()
  @IsString()
  rt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedOfficers?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedOfficerNames?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredCheckpoints?: string[];

  @IsOptional()
  @IsNumber()
  totalCheckpoints?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePatrolScheduleDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(PatrolShift)
  shift?: PatrolShift;

  @IsOptional()
  @IsEnum(PatrolStatus)
  status?: PatrolStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedOfficers?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedOfficerNames?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredCheckpoints?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  reportSummary?: string;
}
