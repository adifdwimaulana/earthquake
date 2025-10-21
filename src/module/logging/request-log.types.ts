export interface CreateRequestLogInput {
  endpoint: string;
  method: string;
  timestamp: number;
  statusCode: number;
  durationMs: number;
  ip?: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  responseMetadata?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface RequestMetricsFilters {
  startTime?: number;
  endTime?: number;
  endpoints?: string[];
}

export interface RequestMetricsPoint {
  day: string;
  value: number;
}
