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

export interface EarthquakeProperties {
  mag: number;
  place: string;
  time: number;
  updated: number;
  tz: number | null;
  url: string;
  detail: string;
  felt: number | null;
  cdi: number | null;
  mmi: number | null;
  alert: string | null;
  status: string;
  tsunami: number;
  sig: number;
  net: string;
  code: string;
  ids: string;
  sources: string;
  types: string;
  nst: number | null;
  dmin: number | null;
  rms: number | null;
  gap: number | null;
  magType: string;
  type: string;
  title: string;
}

export interface EarthquakeItem {
  type: string;
  properties: EarthquakeProperties;
  geometry: {
    type: string;
    coordinates: number[];
  };
  id: string;
}

export interface USGSMetadata {
  generated: number;
  url: string;
  title: string;
  status: number;
  api: string;
  limit: number;
  offset: number;
  count: number;
}

export interface USGSResponse {
  type: string;
  metadata: USGSMetadata;
  features: EarthquakeItem[];
  bbox: number[];
}

export interface IngestResponse {
  stored: number;
}
