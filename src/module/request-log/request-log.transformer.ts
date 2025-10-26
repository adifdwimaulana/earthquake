import { randomUUID } from 'node:crypto';
import { BaseRequestLog, RequestLogRecord } from './request-log.model';

export function transformBaseRequestLogToRecord(
  baseLog: BaseRequestLog,
): RequestLogRecord {
  const timeIso = new Date(baseLog.time).toISOString();
  const dayBucket = timeIso.split('T')[0];
  const monthBucket = dayBucket.slice(0, 7);
  const responseMs = Date.now() - baseLog.time;

  return {
    ...baseLog,
    requestLogId: randomUUID().toString(),
    time: baseLog.time,
    dayBucket,
    monthBucket,
    responseMs,
  };
}
