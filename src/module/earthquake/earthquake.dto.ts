import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsDecimal,
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
  @IsDateString()
  startTime: Date;

  @ApiProperty({
    description: 'End time for filtering earthquakes (ISO 8601 format)',
    required: false,
    example: '2025-01-31T23:59:59Z',
    default: new Date().toISOString(),
  })
  @IsOptional()
  @IsDateString()
  endTime: Date;

  @ApiProperty({
    description: 'Minimum magnitude for filtering earthquakes',
    required: false,
    example: 5.0,
  })
  @IsOptional()
  @IsDecimal()
  minMagnitude: number;

  @ApiProperty({
    description: 'Maximum magnitude for filtering earthquakes',
    required: false,
    example: 7.0,
  })
  @IsOptional()
  @IsDecimal()
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
    example:
      'eyJldmVudElkIjoidXM2MDAwcmpldiIsIm1hZ1NjYWxlZCI6NDUwMCwiZ2xvYmFsTWFnIjoiR0xPQkFMI01BR05JVFVERSJ9',
  })
  @IsString()
  @IsOptional()
  nextToken: string | null;
}

const EXAMPLE_EARTHQUAKE_FEATURE: EarthquakeFeature = {
  type: 'Feature',
  properties: {
    mag: 5.2,
    place: '39 km NW of Slavyanka, Russia',
    time: 1761392723124,
    updated: 1761396988501,
    tz: null,
    url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us6000rjf6',
    detail:
      'https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=us6000rjf6&format=geojson',
    felt: 1,
    cdi: 1,
    mmi: null,
    alert: null,
    status: 'reviewed',
    tsunami: 0,
    sig: 416,
    net: 'us',
    code: '6000rjf6',
    ids: ',us6000rjf6,usauto6000rjf6,',
    sources: ',us,usauto,',
    types: ',dyfi,internal-moment-tensor,origin,phase-data,',
    nst: 95,
    dmin: 1.33,
    rms: 0.51,
    gap: 30,
    magType: 'mb',
    type: 'earthquake',
    title: 'M 5.2 - 39 km NW of Slavyanka, Russia',
  },
  geometry: {
    type: 'Point',
    coordinates: [131.0017, 43.0788, 561.686],
  },
  id: 'us6000rjf6',
};

export class EarthquakeListResponse {
  constructor(data: EarthquakeFeature[], count: number, nextToken?: string) {
    this.data = data;
    this.count = count;
    this.nextToken = nextToken || null;
  }

  @ApiProperty({
    description: 'List of earthquake features',
    type: [EarthquakeFeature],
    example: [EXAMPLE_EARTHQUAKE_FEATURE],
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
    example:
      'eyJldmVudElkIjoidXM2MDAwcmpldiIsIm1hZ1NjYWxlZCI6NDUwMCwiZ2xvYmFsTWFnIjoiR0xPQkFMI01BR05JVFVERSJ9',
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
