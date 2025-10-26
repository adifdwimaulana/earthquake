import { EARTHQUAKE_FEATURE } from '@/shared/constant';
import { ForbiddenFilterException } from '@/shared/exception';
import { encodeLastEvaluatedKey } from '@/shared/util';
import {
  BatchWriteCommand,
  QueryCommand,
  type DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EarthquakeListResponse, EarthquakeQuery } from './earthquake.dto';
import { EarthquakeIndex, EarthquakeRecord } from './earthquake.model';
import { EarthquakeService } from './earthquake.service';
import { transformFeatureToRecord } from './earthquake.transformer';

describe('EarthquakeService', () => {
  let service: EarthquakeService;
  let dbSend: jest.Mock;
  let config: jest.Mock;
  let dynamoClient: DynamoDBDocumentClient;
  let configService: ConfigService;
  const USGS_API_URL = 'https://earthquake.example.com';

  beforeEach(() => {
    dbSend = jest.fn();
    config = jest.fn((key: string) => {
      if (key === 'EARTHQUAKE_TABLE_NAME') return 'earthquake';
      if (key === 'USGS_API_URL') return USGS_API_URL;
      return undefined;
    });

    dynamoClient = { send: dbSend } as unknown as DynamoDBDocumentClient;
    configService = { get: config } as unknown as ConfigService;
    service = new EarthquakeService(dynamoClient, configService);
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ features: [EARTHQUAKE_FEATURE] }),
    } as Response);

    dbSend.mockImplementation((command) => {
      if (command instanceof QueryCommand) {
        return Promise.resolve({ Items: [EARTHQUAKE_FEATURE] });
      }
      if (command instanceof BatchWriteCommand) {
        return Promise.resolve({ UnprocessedItems: { earthquake: [] } });
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Ingest Earthquake Data', () => {
    it('Fetched data and ingest', async () => {
      const response = await service.ingestEarthquakeData();

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining(USGS_API_URL));
      expect(response.message).toEqual(
        'Ingestion completed successfully. Stored 1 records',
      );
      expect(dbSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      expect(dbSend).toHaveBeenCalledWith(expect.any(BatchWriteCommand));
      expect(dbSend).toHaveBeenCalledTimes(2);
    });

    it('No new earthquakes found', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ features: [] }),
      } as Response);
      dbSend.mockResolvedValue({ Items: [] });

      const response = await service.ingestEarthquakeData();

      expect(response.message).toBe('Earthquake data is already up to date');
      expect(dbSend).toHaveBeenCalledWith(expect.any(QueryCommand));
      expect(dbSend).toHaveBeenCalledTimes(1);
    });

    it('Throw InternalServerErrorException due to fetch failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server error',
      } as Response);
      dbSend.mockResolvedValue({ Items: [] });

      await expect(service.ingestEarthquakeData()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it('Retry batch write when UnprocessedItems are found', async () => {
      const record = transformFeatureToRecord(EARTHQUAKE_FEATURE);

      dbSend
        .mockImplementationOnce((command) => {
          if (command instanceof QueryCommand) {
            return Promise.resolve({ Items: [EARTHQUAKE_FEATURE] });
          }

          if (command instanceof BatchWriteCommand) {
            return Promise.resolve({
              UnprocessedItems: {
                earthquake: [{ PutRequest: { Item: record } }],
              },
            });
          }
        })
        .mockImplementationOnce((command) => {
          if (command instanceof BatchWriteCommand) {
            return Promise.resolve({ UnprocessedItems: { earthquake: [] } });
          }
        });

      const response = await service.ingestEarthquakeData();

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining(USGS_API_URL));
      expect(response.message).toEqual(
        'Ingestion completed successfully. Stored 1 records',
      );
      expect(dbSend).toHaveBeenCalledWith(expect.any(BatchWriteCommand));
      expect(dbSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('GET Earthquakes', () => {
    it('Call to db and return EarthquakeListResponse', async () => {
      const record: EarthquakeRecord =
        transformFeatureToRecord(EARTHQUAKE_FEATURE);

      const lastEvaluated = EARTHQUAKE_FEATURE;

      dbSend.mockImplementation((command: QueryCommand) => {
        expect(command).toBeInstanceOf(QueryCommand);
        expect(command.input.TableName).toBe('earthquake');
        expect(command.input.IndexName).toBe(EarthquakeIndex.GSI_TIME);
        return Promise.resolve({
          Items: [record],
          Count: 1,
          LastEvaluatedKey: lastEvaluated,
        });
      });

      const query = new EarthquakeQuery();
      const response = await service.getEarthquakes(query);

      expect(response).toBeInstanceOf(EarthquakeListResponse);
      expect(response.data).toHaveLength(1);
      expect(response.data[0]).toEqual(EARTHQUAKE_FEATURE);
      expect(response.count).toBe(1);
      expect(response.nextToken).toBe(encodeLastEvaluatedKey(lastEvaluated));
    });

    it('Throw ForbiddenFilterException for invalid filter combinations', async () => {
      const query = {
        startTime: new Date(),
        endTime: new Date(),
        location: 'California',
      } as unknown as EarthquakeQuery;

      await expect(service.getEarthquakes(query)).rejects.toBeInstanceOf(
        ForbiddenFilterException,
      );
      expect(dbSend).not.toHaveBeenCalled();
    });
  });

  describe('GET Earthquake by event ID', () => {
    it('Call to db and return EarthquakeFeature', async () => {
      const record = transformFeatureToRecord(EARTHQUAKE_FEATURE);
      dbSend.mockResolvedValue({ Items: [record] });

      const feature = await service.getByEventId('eventId');

      expect(feature).toEqual(EARTHQUAKE_FEATURE);
      expect(dbSend).toHaveBeenCalledWith(expect.any(QueryCommand));
    });

    it('Throw NotFoundException when no record found', async () => {
      dbSend.mockResolvedValue({ Items: [] });

      await expect(
        service.getByEventId('eventIdNotFound'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
