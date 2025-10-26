import { DYNAMODB_CLIENT } from '@/module/dynamo/dynamo.provider';
import { dateToISODateString } from '@/shared/util';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RequestCountData,
  RequestCountQuery,
  RequestCountResponse,
} from './request-log.dto';
import {
  RequestLogIndex,
  RequestLogRecord,
  type BaseRequestLog,
} from './request-log.model';
import { transformBaseRequestLogToRecord } from './request-log.transformer';

@Injectable()
export class RequestLogService {
  private readonly logger = new Logger(RequestLogService.name);
  private readonly tableName: string;

  constructor(
    @Inject(DYNAMODB_CLIENT) private readonly db: DynamoDBDocumentClient,
    private readonly configService: ConfigService,
  ) {
    this.tableName =
      this.configService.get<string>('REQUEST_LOG_TABLE_NAME') || 'log';
  }

  async ingestLog(input: BaseRequestLog): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: transformBaseRequestLogToRecord(input),
    });

    try {
      await this.db.send(command);
    } catch (error) {
      this.logger.error(`Failed to write request log`, error);
    }
  }

  public async getRequestCountPerDay(
    query: RequestCountQuery,
  ): Promise<RequestCountResponse> {
    const { date, endpoint } = query;

    const dateBucket = dateToISODateString(date);

    const queryCommand: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: RequestLogIndex.GSI_DAYBUCKET_ENDPOINT,
      KeyConditionExpression: '#dayBucket = :dayBucket',
      ExpressionAttributeNames: {
        '#dayBucket': 'dayBucket',
      },
      ExpressionAttributeValues: {
        ':dayBucket': dateBucket,
      },
    };

    if (endpoint) {
      queryCommand.KeyConditionExpression += ' AND #endpoint = :endpoint';
      queryCommand.ExpressionAttributeNames!['#endpoint'] = 'endpoint';
      queryCommand.ExpressionAttributeValues![':endpoint'] = endpoint;
    }

    const command = new QueryCommand(queryCommand);
    const { Items } = await this.db.send(command);

    const endpointMap: Record<string, number> = {};
    if (Items && Items.length > 0) {
      for (const item of Items as RequestLogRecord[]) {
        const endpoint = item.endpoint;

        if (endpointMap[endpoint]) {
          endpointMap[endpoint] += 1;
        } else {
          endpointMap[endpoint] = 1;
        }
      }
    }

    const data = Object.entries(endpointMap).map(([endpoint, count]) => {
      return new RequestCountData(endpoint, count);
    });

    return { data };
  }

  private normalizeEndpointKey(endpoint: string): string {
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }
}
