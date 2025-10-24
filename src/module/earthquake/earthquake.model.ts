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

export interface EarthquakeRecord {
  id: string;
  time: number;
  mag: number;
  allKey: string;
  tsunami: number;
  location: string;
  locationTsunami: string;
  magBucket: string;
  attributes: EarthquakeItem;
}
