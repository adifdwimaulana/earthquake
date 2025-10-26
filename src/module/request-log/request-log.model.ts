export interface BaseRequestLog {
  endpoint: string;
  method: string;
  time: number;
  query: Record<string, unknown>;
  params: Record<string, unknown>;
  body: Record<string, unknown>;
  headers: Record<string, unknown>;
  statusCode: number;
}

export interface RequestLogRecord extends BaseRequestLog {
  requestLogId: string; // e.g: (pk: GET#/earthquake, sk: 2025-01-01T00:00:00.000Z)
  responseMs: number;
  dayBucket: string;
  monthBucket: string;
}

export enum RequestLogIndex {
  GSI_DAYBUCKET_ENDPOINT = 'GSI_DayBucket_Endpoint',
  GSI_MONTHBUCKET_MAGNITUDE = 'GSI_MonthBucket_Magnitude',
}
