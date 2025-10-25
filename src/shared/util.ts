export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp);
}

export function dateToTimestamp(date: Date): number {
  return date.getTime();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function scaleMagnitude(magnitude: number): number {
  return Math.round(magnitude * 1000);
}

export function encodeLastEvaluatedKey(key: any): string {
  return Buffer.from(JSON.stringify(key)).toString('base64');
}

export function decodeLastEvaluatedKey(
  encodedKey: string,
): Record<string, any> | undefined {
  try {
    const decoded = Buffer.from(encodedKey, 'base64').toString('utf-8');
    return JSON.parse(decoded) as Record<string, any>;
  } catch (error) {
    console.error('Failed to decode last evaluated key', error);
    return undefined;
  }
}
