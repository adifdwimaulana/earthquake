export function encodePaginationToken(key: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(key), 'utf8').toString('base64url');
}

export function decodePaginationToken<T = Record<string, unknown>>(
  token: string,
): T {
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8');
    return JSON.parse(json) as T;
  } catch {
    throw new Error('Invalid pagination token');
  }
}
