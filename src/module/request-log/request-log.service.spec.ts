import { BASE_REQUEST_LOG, REQUEST_COUNT_BY_ENDPOINT } from '@/shared/constant';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';
import { RequestCountQuery } from './request-log.dto';
import { RequestLogService } from './request-log.service';

describe('RequestLogService', () => {
  let service: RequestLogService;
  let dbSend: jest.Mock;
  let config: jest.Mock;
  let dynamoClient: DynamoDBDocumentClient;
  let configService: ConfigService;

  beforeEach(() => {
    dbSend = jest.fn();
    config = jest.fn((key: string) =>
      key === 'REQUEST_LOG_TABLE_NAME' ? 'log' : undefined,
    );

    dynamoClient = { send: dbSend } as unknown as DynamoDBDocumentClient;
    configService = { get: config } as unknown as ConfigService;
    service = new RequestLogService(dynamoClient, configService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Ingest log to db', async () => {
    dbSend.mockResolvedValue(undefined);

    await service.ingestLog(BASE_REQUEST_LOG);

    expect(dbSend).toHaveBeenCalledTimes(1);
    const [command] = dbSend.mock.calls[0] as PutCommand[];
    expect(command).toBeInstanceOf(PutCommand);
    expect(command.input.TableName).toBe('log');
  });

  it('GET request count per day', async () => {
    dbSend.mockResolvedValue({ Items: REQUEST_COUNT_BY_ENDPOINT });

    const result = await service.getRequestCountPerDay({
      date: new Date('2025-01-01T00:00:00.000Z'),
    } as RequestCountQuery);

    expect(dbSend).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(dbSend).toHaveBeenCalledTimes(1);
    expect(result.data).toHaveLength(2);
  });

  it('GET request count per day with endpoint filter', async () => {
    dbSend.mockResolvedValue({ Items: [] });

    const result = await service.getRequestCountPerDay({
      date: new Date('2023-01-01T00:00:00Z'),
      endpoint: '/earthquakes',
    });

    expect(dbSend).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(dbSend).toHaveBeenCalledTimes(1);
    expect(result.data).toHaveLength(0);
  });
});
