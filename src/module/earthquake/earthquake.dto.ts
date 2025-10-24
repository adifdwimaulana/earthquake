import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class EarthquakeQuery {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @IsDateString()
  startTime: Date;

  @IsOptional()
  @IsDateString()
  endTime: Date;

  @IsOptional()
  @IsNumber()
  minMagnitude: number;

  @IsOptional()
  @IsNumber()
  maxMagnitude: number;

  @IsOptional()
  @IsBoolean()
  isTsunami: boolean;
}

export class RequestMetricsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  startTime?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  endTime?: number;

  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsIn(['day', 'week'])
  interval: 'day' | 'week' = 'day';
}
