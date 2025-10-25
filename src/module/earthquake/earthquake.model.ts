import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class EarthquakeProperties {
  @IsNumber()
  mag: number;

  @IsString()
  place: string;

  @IsNumber()
  time: number;

  @IsNumber()
  updated: number;

  @IsOptional()
  @IsNumber()
  tz: number | null;

  @IsString()
  url: string;

  @IsString()
  detail: string;

  @IsOptional()
  @IsNumber()
  felt: number | null;

  @IsOptional()
  @IsNumber()
  cdi: number | null;

  @IsOptional()
  @IsNumber()
  mmi: number | null;

  @IsOptional()
  @IsString()
  alert: string | null;

  @IsString()
  status: string;

  @IsNumber()
  tsunami: number;

  @IsNumber()
  sig: number;

  @IsString()
  net: string;

  @IsString()
  code: string;

  @IsString()
  ids: string;

  @IsString()
  sources: string;

  @IsString()
  types: string;

  @IsOptional()
  @IsNumber()
  nst: number | null;

  @IsOptional()
  @IsNumber()
  dmin: number | null;

  @IsOptional()
  @IsNumber()
  rms: number | null;

  @IsOptional()
  @IsNumber()
  gap: number | null;

  @IsString()
  magType: string;

  @IsString()
  type: string;

  @IsString()
  title: string;
}

export class Geometry {
  @IsString()
  type: string;

  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: number[];
}

export class EarthquakeFeature {
  @IsString()
  type: string;

  @ValidateNested()
  @Type(() => EarthquakeProperties)
  properties: EarthquakeProperties;

  @ValidateNested()
  @Type(() => Geometry)
  geometry: Geometry;

  @IsString()
  id: string;
}

export class USGSMetadata {
  @IsNumber()
  generated: number;

  @IsString()
  url: string;

  @IsString()
  title: string;

  @IsNumber()
  status: number;

  @IsString()
  api: string;

  @IsNumber()
  limit: number;

  @IsNumber()
  offset: number;

  @IsNumber()
  count: number;
}

export class USGSResponse {
  @IsString()
  type: string;

  @ValidateNested()
  @Type(() => USGSMetadata)
  metadata: USGSMetadata;

  @ValidateNested({ each: true })
  @Type(() => EarthquakeFeature)
  features: EarthquakeFeature[];

  @IsArray()
  @IsNumber({}, { each: true })
  bbox: number[];
}

export class EarthquakeRecord {
  @IsString()
  eventId: string;

  @IsNumber()
  time: number;

  @IsString()
  globalTime: string;

  @IsString()
  globalMag: string;

  @IsNumber()
  magScaled: number;

  @IsString()
  location: string;

  @IsString()
  status: string;

  @IsNumber()
  tsunami: number;

  @ValidateNested()
  @Type(() => EarthquakeFeature)
  feature: EarthquakeFeature;
}

export enum EarthquakeIndex {
  GSI_TIME = 'GSI_Time',
  GSI_MAGNITUDE = 'GSI_Magnitude',
  GSI_LOCATION_MAGNITUDE = 'GSI_Location_Magnitude',
  GSI_TSUNAMI_TIME = 'GSI_Tsunami_Time',

  /* Optional: not used in current implementation */
  GSI_STATUS_TIME = 'GSI_Status_Time',
  GSI_NETWORK_TIME = 'GSI_Network_Time',
}
