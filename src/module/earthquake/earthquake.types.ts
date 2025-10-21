export interface UsgsFeature {
  id: string;
  properties: {
    time: number;
    updated?: number;
    url?: string;
    type?: string;
    mag?: number | null;
    magType?: string | null;
    status?: string | null;
    tsunami?: number;
    sig?: number | null;
    place?: string | null;
  };
  geometry?: {
    type?: string;
    coordinates?: [number, number, number];
  };
}

export interface EarthquakeItem {
  pk: string;
  sk: number;
  id: string;
  eventTime: number;
  updatedAt: number;
  type: string | null;
  magnitude: number | null;
  magnitudeType: string | null;
  status: string | null;
  depth: number | null;
  latitude: number | null;
  longitude: number | null;
  place: string;
  region: string;
  url: string | null;
  tsunami: boolean;
  significance: number | null;
  generatedAt: number;
  gsi1pk: string;
  dayBucket: string;
}

export interface EarthquakeQueryFilters {
  limit?: number;
  startTime?: number;
  endTime?: number;
  minMagnitude?: number;
  maxMagnitude?: number;
  region?: string;
  nextToken?: string;
}

export interface EarthquakeQueryResult<TItem> {
  items: TItem[];
  count: number;
  nextToken?: string;
}
