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

export interface EarthquakeFeature {
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
  features: EarthquakeFeature[];
  bbox: number[];
}

export interface EarthquakeRecord {
  eventId: string;
  time: number;
  globalTime: string;
  globalMag: string;
  magScaled: number;
  location: string;
  status: string;
  tsunami: number;
  feature: EarthquakeFeature;
}

export enum EarthquakeIndex {
  GSI_TIME = 'GSI_Time',
  GSI_MAGNITUDE = 'GSI_Magnitude',
  GSI_LOCATION_MAGNITUDE = 'GSI_Location_Magnitude',
  GSI_STATUS_TIME = 'GSI_Status_Time',
  GSI_TSUNAMI_TIME = 'GSI_Tsunami_Time',
  GSI_NETWORK_TIME = 'GSI_Network_Time', // Optional: not used in current implementation
}
