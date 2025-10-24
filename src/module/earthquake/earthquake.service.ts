import { DYNAMODB_CLIENT } from '@/module/dynamo/dynamo.provider';
import {
  BatchWriteCommand,
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

import { getErrorMessage } from '@/shared/utils/common';
import {
  EarthquakeItem,
  EarthquakeRecord,
  USGSResponse,
} from './earthquake.model';
import { batchArray, transformFeatureToRecord } from './earthquake.transformer';

@Injectable()
export class EarthquakeService {
  private readonly logger = new Logger(EarthquakeService.name);
  private readonly earthquakeTable: string;
  private readonly usgsUrl: string;

  constructor(
    @Inject(DYNAMODB_CLIENT) private readonly db: DynamoDBDocumentClient,
    private readonly configService: ConfigService,
  ) {
    this.earthquakeTable =
      this.configService.get<string>('EARTHQUAKE_TABLE_NAME') || 'earthquake';
    this.usgsUrl =
      this.configService.get<string>('USGS_API_URL') || 'FALLBACK_URL';
  }

  /**
   * Get the latest earthquake timestamp from DynamoDB
   */
  private async getLatestEarthquakeTimestamp(): Promise<number | null> {
    try {
      const command = new QueryCommand({
        TableName: this.earthquakeTable,
        IndexName: 'GSI_Latest',
        KeyConditionExpression: 'allKey = :allKey',
        ExpressionAttributeValues: {
          ':allKey': 'ALL',
        },
        ScanIndexForward: false,
        Limit: 1,
      });

      const result = await this.db.send(command);

      if (result.Items && result.Items.length > 0) {
        return result.Items[0].time as number; // Use 'time' field from GSI
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to get latest earthquake timestamp', {
        error: getErrorMessage(error),
      });
      throw new InternalServerErrorException(
        'Failed to get latest earthquake timestamp',
      );
    }
  }

  /**
   * Fetch earthquake data from USGS API
   */
  private async fetchUsgsData(
    startTime?: number,
    limit = 100,
  ): Promise<EarthquakeItem[]> {
    try {
      let url = `${this.usgsUrl}?format=geojson&limit=${limit}&orderby=time`;

      if (startTime) {
        const startTimeIso = new Date(startTime).toISOString();
        url += `&starttime=${startTimeIso}`;
      }

      this.logger.log(`Fetching earthquake data from: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as USGSResponse;

      if (!data || !data.features) {
        throw new Error('Invalid data format received from USGS');
      }

      this.logger.log(
        `Fetched ${data.features.length} earthquake records from USGS`,
      );

      return data.features;
    } catch (error) {
      this.logger.error('Failed to fetch earthquake data from USGS', {
        error: getErrorMessage(error),
        startTime,
        limit,
      });
      throw new InternalServerErrorException(
        'Failed to fetch earthquake data from USGS',
      );
    }
  }

  /**
   * Store earthquake items in DynamoDB using batch write
   */
  private async storeEarthquakeItems(
    items: EarthquakeRecord[],
  ): Promise<number> {
    if (items.length === 0) {
      return 0;
    }

    try {
      // DynamoDB batch write supports up to 25 items per request
      const batches = batchArray(items, 25);
      let totalStored = 0;

      for (const batch of batches) {
        const putRequests = batch.map((item) => ({
          PutRequest: {
            Item: item,
          },
        }));

        const command = new BatchWriteCommand({
          RequestItems: {
            [this.earthquakeTable]: putRequests,
          },
        });

        const result = await this.db.send(command);

        // Handle unprocessed items if any
        if (
          result.UnprocessedItems &&
          result.UnprocessedItems[this.earthquakeTable]?.length > 0
        ) {
          this.logger.warn(
            `${result.UnprocessedItems[this.earthquakeTable].length} items were not processed`,
          );
          // In production, you might want to retry unprocessed items
        }

        totalStored += batch.length;
      }

      this.logger.log(`Successfully stored ${totalStored} earthquake records`);
      return totalStored;
    } catch (error) {
      this.logger.error('Failed to store earthquake items in DynamoDB', {
        error: error instanceof Error ? error.message : String(error),
        itemCount: items.length,
      });
      throw new InternalServerErrorException(
        'Failed to store earthquake data in database',
      );
    }
  }

  /**
   * Main method to ingest earthquake data
   */
  public async ingestEarthquakeData(): Promise<{ message: string }> {
    try {
      this.logger.log('Starting earthquake data ingestion');

      const latestTimestamp = await this.getLatestEarthquakeTimestamp();

      const usgsFeatures = await this.fetchUsgsData(
        latestTimestamp ?? undefined,
      );

      if (usgsFeatures.length === 0) {
        this.logger.log('No new earthquake data available');
        return { message: 'No new earthquake data available' };
      }

      // Filter out duplicates if we have a latest timestamp
      const newFeatures = latestTimestamp
        ? usgsFeatures.filter(
            (feature) => feature.properties.time > latestTimestamp,
          )
        : usgsFeatures;

      if (newFeatures.length === 0) {
        this.logger.log('No new earthquake data after filtering duplicates');
        return { message: 'No new earthquake data available' };
      }

      const earthquakeItems = newFeatures.map(transformFeatureToRecord);

      const storedCount = await this.storeEarthquakeItems(earthquakeItems);

      this.logger.log(
        `Ingestion completed successfully. Stored ${storedCount} new records`,
      );

      return {
        message: `Ingestion completed successfully. Stored ${storedCount} new records`,
      };
    } catch (error) {
      this.logger.error('Earthquake data ingestion failed', {
        error: getErrorMessage(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
}
