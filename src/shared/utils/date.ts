export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp);
}

export function dateToTimestamp(date: Date): number {
  return date.getTime();
}
