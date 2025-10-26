import { EARTHQUAKE_FEATURE, NEXT_TOKEN } from '@/shared/constant';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { EarthquakeFeature } from './earthquake.model';

export class EarthquakeQuery {
  @ApiProperty({
    description: 'Number of records to return',
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiProperty({
    description: 'Start time for filtering earthquakes (ISO 8601 format)',
    required: false,
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDate()
  startTime: Date;

  @ApiProperty({
    description: 'End time for filtering earthquakes (ISO 8601 format)',
    required: false,
    example: '2025-01-31T23:59:59Z',
    default: new Date().toISOString(),
  })
  @IsOptional()
  @IsDate()
  endTime: Date;

  @ApiProperty({
    description: 'Minimum magnitude for filtering earthquakes',
    required: false,
    example: 5.0,
  })
  @IsOptional()
  @IsNumber()
  minMagnitude: number;

  @ApiProperty({
    description: 'Maximum magnitude for filtering earthquakes',
    required: false,
    example: 7.0,
  })
  @IsOptional()
  @IsNumber()
  maxMagnitude: number;

  @ApiProperty({
    description: 'Location based on last part of the place string',
    required: false,
    example: 'California',
  })
  @IsString()
  @IsOptional()
  location: string;

  @ApiProperty({
    description: 'Filter for tsunami events',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isTsunami: boolean;

  @ApiProperty({
    description: 'Token to fetch the next page',
    required: false,
    type: String,
    example: NEXT_TOKEN,
  })
  @IsString()
  @IsOptional()
  nextToken: string | null;
}

export class EarthquakeListResponse {
  constructor(data: EarthquakeFeature[], count: number, nextToken?: string) {
    this.data = data;
    this.count = count;
    this.nextToken = nextToken || null;
  }

  @ApiProperty({
    description: 'List of earthquake features',
    type: [EarthquakeFeature],
    example: [EARTHQUAKE_FEATURE],
  })
  @ValidateNested({ each: true })
  @Type(() => EarthquakeFeature)
  data: EarthquakeFeature[];

  @ApiProperty({
    description: 'Total earthquake',
    example: 10,
  })
  @IsNumber()
  count: number;

  @ApiProperty({
    description: 'Token to fetch the next page',
    required: false,
    type: String,
    example: NEXT_TOKEN,
  })
  @IsString()
  @IsOptional()
  nextToken: string | null;
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
