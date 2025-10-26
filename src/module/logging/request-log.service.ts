import { DYNAMODB_CLIENT } from '@/module/dynamo/dynamo.provider';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type {
  CreateRequestLogInput,
  RequestMetricsFilters,
  RequestMetricsPoint,
} from './request-log.types';

@Injectable()
export class RequestLogService {
  private readonly logger = new Logger(RequestLogService.name);
  private readonly tableName: string;

  constructor(
    @Inject(DYNAMODB_CLIENT) private readonly dynamo: DynamoDBDocumentClient,
    private readonly configService: ConfigService,
  ) {
    this.tableName = this.configService.get<string>('LOG_TABLE_NAME') || 'log';
  }

  async createLog(input: CreateRequestLogInput): Promise<void> {
    const timestampIso = new Date(input.timestamp).toISOString();
    const endpointKey = this.normalizeEndpointKey(input.endpoint);

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        eventId: randomUUID(),
        pk: endpointKey,
        sk: timestampIso,
        id: randomUUID(),
        endpoint: input.endpoint,
        method: input.method,
        statusCode: input.statusCode,
        durationMs: input.durationMs,
        request: {
          query: input.query ?? {},
          body: input.body ?? {},
          headers: input.headers ?? {},
          ip: input.ip ?? null,
          params: input.params ?? {},
        },
        response: input.responseMetadata ?? {},
        metadata: input.metadata ?? {},
        dayBucket: this.getDayBucket(input.timestamp),
        createdAt: Date.now(),
      },
    });

    try {
      await this.dynamo.send(command);
    } catch (error) {
      this.logger.warn(
        `Failed to write request log: ${(error as Error).message}`,
      );
    }
  }

  async getRequestCountsByDay(
    filters: RequestMetricsFilters,
  ): Promise<RequestMetricsPoint[]> {
    const start = filters.startTime ?? Date.now() - 1000 * 60 * 60 * 24 * 7;
    const end = filters.endTime ?? Date.now();
    if (start > end) {
      throw new Error('startTime must be before endTime');
    }

    const startIso = new Date(start).toISOString();
    const endIso = new Date(end).toISOString();
    const endpoints = filters.endpoints?.map((endpoint) =>
      this.normalizeEndpointKey(endpoint),
    ) ?? [
      this.normalizeEndpointKey('/earthquake/ingest'),
      this.normalizeEndpointKey('/earthquake'),
    ];

    const counts = new Map<string, number>();

    for (const endpoint of endpoints) {
      let exclusiveStartKey: Record<string, unknown> | undefined = undefined;

      do {
        const query: QueryCommandInput = {
          TableName: this.tableName,
          KeyConditionExpression: '#pk = :pk AND #sk BETWEEN :start AND :end',
          ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' },
          ExpressionAttributeValues: {
            ':pk': endpoint,
            ':start': startIso,
            ':end': endIso,
          },
          ExclusiveStartKey: exclusiveStartKey,
        };

        const result = await this.dynamo.send(new QueryCommand(query));
        for (const item of result.Items ?? []) {
          const day =
            (item.dayBucket as string | undefined) ??
            this.getDayFromSk(item.sk);
          counts.set(day, (counts.get(day) ?? 0) + 1);
        }

        exclusiveStartKey = result.LastEvaluatedKey;
      } while (exclusiveStartKey);
    }

    const points: RequestMetricsPoint[] = Array.from(counts.entries())
      .map(([day, value]) => ({ day, value }))
      .sort((a, b) => (a.day < b.day ? -1 : 1));

    return points;
  }

  private getDayBucket(timestamp: number): string {
    return new Date(timestamp).toISOString().slice(0, 10);
  }

  private getDayFromSk(sk: unknown): string {
    if (typeof sk === 'string' && sk.length >= 10) {
      return sk.slice(0, 10);
    }
    return this.getDayBucket(Date.now());
  }

  private normalizeEndpointKey(endpoint: string): string {
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }
}
