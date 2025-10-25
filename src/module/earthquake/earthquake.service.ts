import { DYNAMODB_CLIENT } from '@/module/dynamo/dynamo.provider';
import { MessageResponse } from '@/shared/model';
import { sleep } from '@/shared/utils/date';
import {
  BatchWriteCommand,
  BatchWriteCommandInput,
  QueryCommand,
  type DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  EarthquakeFeature,
  EarthquakeIndex,
  EarthquakeRecord,
  USGSResponse,
} from './earthquake.model';
import { batchArray, transformFeatureToRecord } from './earthquake.transformer';

@Injectable()
export class EarthquakeService {
  private readonly logger = new Logger(EarthquakeService.name);
  private readonly EARTHQUAKE_TABLE: string;
  private readonly USGS_API_URL: string;
  private readonly USGS_API_LIMIT = 100;
  private readonly USGS_ERROR_MESSAGE =
    'Failed to fetch earthquake data from USGS API';
  private readonly MAX_RETRIES = 3;
  private readonly MAX_BATCH_SIZE = 25;

  constructor(
    @Inject(DYNAMODB_CLIENT) private readonly db: DynamoDBDocumentClient,
    private readonly configService: ConfigService,
  ) {
    this.EARTHQUAKE_TABLE =
      this.configService.get<string>('EARTHQUAKE_TABLE_NAME') || 'earthquake';
    this.USGS_API_URL =
      this.configService.get<string>('USGS_API_URL') || 'FALLBACK_URL';
  }

  private async getLatestTimestamp(): Promise<number | null> {
    const command = new QueryCommand({
      TableName: this.EARTHQUAKE_TABLE,
      IndexName: EarthquakeIndex.GSI_TIME,
      KeyConditionExpression: 'globalTime = :globalTime',
      ExpressionAttributeValues: {
        ':globalTime': 'GLOBAL#TIME',
      },
      ScanIndexForward: false,
      Limit: 1,
    });

    const { Items } = await this.db.send(command);

    if (Items && Items.length > 0) {
      return Items[0].time as number;
    }

    return null;
  }

  /**
   *
   * @param startTimestamp latest timestamp from DB that will be used to fetch only newer records
   * @returns earthquake features from USGS API
   */
  private async fetchUsgsApi(): Promise<EarthquakeFeature[]> {
    try {
      const lastTimestamp = await this.getLatestTimestamp();
      const startTimeQuery = lastTimestamp
        ? `&starttime=${new Date(lastTimestamp + 1).toISOString()}` // +1ms because starttime is inclusive
        : '';
      const url = `${this.USGS_API_URL}?format=geojson&&orderby=time&limit=${this.USGS_API_LIMIT}${startTimeQuery}`;

      this.logger.log(`Fetching earthquake data from USGS API: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as USGSResponse;

      if (!data || !data.features) {
        throw new Error('Invalid data format received from USGS API');
      }

      return data.features;
    } catch (error) {
      this.logger.error(this.USGS_ERROR_MESSAGE, error);
      throw new InternalServerErrorException(this.USGS_ERROR_MESSAGE);
    }
  }

  private async executeBatchAndHandleUnprocessed(
    requestItems: BatchWriteCommandInput['RequestItems'],
    attempt = 1,
  ): Promise<number> {
    if (
      !requestItems ||
      !requestItems[this.EARTHQUAKE_TABLE] ||
      requestItems[this.EARTHQUAKE_TABLE].length === 0
    ) {
      this.logger.warn('[BatchWrite] No request items to process');
      return 0;
    }

    try {
      const { UnprocessedItems } = await this.db.send(
        new BatchWriteCommand({ RequestItems: requestItems }),
      );

      // If all processed, return stored count
      if (
        !UnprocessedItems ||
        !UnprocessedItems[this.EARTHQUAKE_TABLE] ||
        UnprocessedItems[this.EARTHQUAKE_TABLE].length === 0
      ) {
        return Object.values(requestItems[this.EARTHQUAKE_TABLE]).length;
      }

      // Retry unprocessed items
      const unprocessedItems = UnprocessedItems[this.EARTHQUAKE_TABLE];
      const backoffMs = Math.pow(2, attempt) * 100;

      this.logger.warn(
        `[BatchWrite] Attempt ${attempt}: ${unprocessedItems.length} unprocessed items, retrying in ${backoffMs} ms`,
      );

      // If MAX_RETRIES reached, give up
      if (attempt >= this.MAX_RETRIES) {
        this.logger.error(
          `[BatchWrite] Giving up after ${this.MAX_RETRIES} attempts (${unprocessedItems.length} items still unprocessed)`,
        );
        return (
          requestItems[this.EARTHQUAKE_TABLE].length - unprocessedItems.length
        );
      }

      await sleep(backoffMs);
      return this.executeBatchAndHandleUnprocessed(
        { [this.EARTHQUAKE_TABLE]: unprocessedItems },
        attempt + 1,
      );
    } catch (error) {
      this.logger.error(`[BatchWrite] Error on attempt ${attempt}`, error);
      throw new InternalServerErrorException('Batch write failed');
    }
  }

  /**
   * Store earthquake items in DynamoDB using batch write
   */
  private async batchInsert(items: EarthquakeRecord[]): Promise<number> {
    if (items.length === 0) {
      return 0;
    }

    try {
      const batches = batchArray(items, this.MAX_BATCH_SIZE);
      let totalStored = 0;

      for (const batch of batches) {
        const batchRequest = batch.map((item) => ({
          PutRequest: { Item: item },
        }));

        const requestItems = {
          [this.EARTHQUAKE_TABLE]: batchRequest,
        };

        const storedCount =
          await this.executeBatchAndHandleUnprocessed(requestItems);

        totalStored += storedCount;
      }

      this.logger.log(`Successfully stored ${totalStored} earthquake records`);
      return totalStored;
    } catch (error) {
      this.logger.error('Failed to store earthquake items in DynamoDB', error);
      throw new InternalServerErrorException(
        'Failed to store earthquake data in database',
      );
    }
  }

  /**
   * Main method to ingest earthquake data
   */
  public async ingestEarthquakeData(): Promise<MessageResponse> {
    try {
      const earthquakeFeatures = await this.fetchUsgsApi();

      if (earthquakeFeatures.length === 0) {
        return new MessageResponse('Earthquake data is already up to date');
      }

      const records = earthquakeFeatures.map(transformFeatureToRecord);
      const storedCount = await this.batchInsert(records);

      return new MessageResponse(
        `Ingestion completed successfully. Stored ${storedCount} new records`,
      );
    } catch (error) {
      this.logger.error('Earthquake data ingestion failed', error);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduledIngestEarthquakeData(): Promise<void> {
    this.logger.log(
      `Starting scheduled earthquake data ingestion at ${new Date().toISOString()}`,
    );
    try {
      const result = await this.ingestEarthquakeData();
      this.logger.log(result.message);
    } catch (error) {
      this.logger.error('Earthquake data ingestion failed', error);
    }
  }
}
