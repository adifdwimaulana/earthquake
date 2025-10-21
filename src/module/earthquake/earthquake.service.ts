import { DYNAMODB_CLIENT } from '@/module/dynamo/dynamo.provider';
import {
  decodePaginationToken,
  encodePaginationToken,
} from '@/shared/utils/pagination';
import {
  type DynamoDBDocumentClient,
  QueryCommand,
  type QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { USGSResponse } from './earthquake.dto';
import type {
  EarthquakeItem,
  EarthquakeQueryFilters,
  EarthquakeQueryResult,
  UsgsFeature,
} from './earthquake.types';

const EARTHQUAKE_TABLE_PK = 'EARTHQUAKE';
const REGION_GSI_NAME = 'RegionIndex';
const MAGNITUDE_LSI_NAME = 'MagnitudeIndex';

@Injectable()
export class EarthquakeService {
  private readonly logger = new Logger(EarthquakeService.name);
  private readonly earthquakeTable: string;
  private readonly usgsUrl: string;

  constructor(
    @Inject(DYNAMODB_CLIENT) private readonly dynamo: DynamoDBDocumentClient,
    private readonly configService: ConfigService,
  ) {
    this.earthquakeTable =
      this.configService.get<string>('EARTHQUAKE_TABLE_NAME') ??
      'EarthquakesTable';
    this.usgsUrl =
      this.configService.get<string>('USGS_API_URL') ??
      'https://earthquake.usgs.gov/fdsnws/event/1/query';
  }

  async ingestEarthquakeData() {
    const response = await fetch(`${this.usgsUrl}?format=geojson&limit=100`);

    if (!response.ok) {
      throw new InternalServerErrorException(
        'Failed to fetch earthquake data from USGS',
      );
    }

    const data = (await response.json()) as USGSResponse;

    if (!data || !data.features) {
      throw new InternalServerErrorException(
        'Invalid data format received from USGS',
      );
    }

    data.features.forEach((feature) => {
      console.log('Processing feature:', feature);
    });

    console.log('Ingested Earthquake Data:', data);
  }

  async fetchAndStoreRecentEarthquakes(limit = 100): Promise<number> {
    const response = await fetch(this.usgsUrl);
    if (!response.ok) {
      this.logger.error(
        `USGS API error: ${response.status} ${response.statusText}`,
      );
      throw new HttpException(
        'Failed to fetch earthquake data',
        response.status,
      );
    }

    const payload = (await response.json()) as { features?: UsgsFeature[] };
    const features = payload.features ?? [];

    if (features.length === 0) {
      this.logger.warn('No earthquake data received from USGS feed');
      throw new HttpException(
        'No earthquake data available',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const earthquakes = features
      .slice(0, limit)
      .map((feature) => this.mapToEarthquakeItem(feature))
      .filter((item): item is EarthquakeItem => item !== null);

    if (earthquakes.length === 0) {
      throw new HttpException(
        'Received earthquake payload did not contain valid data',
        HttpStatus.BAD_GATEWAY,
      );
    }

    // await this.persistEarthquakes(earthquakes);
    this.logger.log(`Stored ${earthquakes.length} earthquake events`);
    return earthquakes.length;
  }

  async listEarthquakes(
    filters: EarthquakeQueryFilters,
  ): Promise<EarthquakeQueryResult<EarthquakeItem>> {
    const query = this.buildListQuery(filters);
    const result = await this.dynamo.send(new QueryCommand(query));

    const items = (result.Items ?? []) as EarthquakeItem[];
    const nextKey = result.LastEvaluatedKey
      ? encodePaginationToken(result.LastEvaluatedKey)
      : undefined;

    return { items, nextToken: nextKey, count: items.length };
  }

  private mapToEarthquakeItem(feature: UsgsFeature): EarthquakeItem | null {
    const { id, properties, geometry } = feature;
    if (!id || !properties) {
      return null;
    }

    const timestamp = properties.time;
    if (typeof timestamp !== 'number') {
      return null;
    }

    const magnitude = properties.mag ?? null;
    const place = properties.place ?? 'Unknown';
    const [longitude, latitude, depth] = geometry?.coordinates ?? [
      null,
      null,
      null,
    ];
    const region = this.deriveRegion(place);

    const item: EarthquakeItem = {
      pk: EARTHQUAKE_TABLE_PK,
      sk: timestamp,
      id,
      eventTime: timestamp,
      updatedAt: properties.updated ?? timestamp,
      type: properties.type ?? 'earthquake',
      magnitude,
      magnitudeType: properties.magType ?? null,
      status: properties.status ?? null,
      depth: typeof depth === 'number' ? depth : null,
      latitude: typeof latitude === 'number' ? latitude : null,
      longitude: typeof longitude === 'number' ? longitude : null,
      place,
      region,
      url: properties.url ?? null,
      tsunami: properties.tsunami === 1,
      significance: properties.sig ?? null,
      generatedAt: Date.now(),
      gsi1pk: region,
      dayBucket: this.getDayBucket(timestamp),
    };

    return item;
  }

  // private async persistEarthquakes(items: EarthquakeItem[]): Promise<void> {
  //   const batches = chunkArray(items, 25);

  //   for (const batch of batches) {
  //     let remaining: any = batch.map((item) => ({
  //       PutRequest: { Item: item },
  //     }));

  //     let attempt = 0;

  //     do {
  //       const request: BatchWriteCommandInput = {
  //         RequestItems: {
  //           [this.earthquakeTable]: remaining,
  //         },
  //       };

  //       const result = await this.dynamo.send(new BatchWriteCommand(request));
  //       remaining = result.UnprocessedItems?.[this.earthquakeTable] ?? [];

  //       if (remaining.length > 0) {
  //         attempt += 1;
  //         this.logger.warn(
  //           `Retrying ${remaining.length} unprocessed earthquake records (attempt ${attempt})`,
  //         );
  //         await this.backoff(attempt);
  //       }
  //     } while (remaining.length > 0 && attempt < 5);

  //     if (remaining.length > 0) {
  //       this.logger.error(
  //         `Failed to persist ${remaining.length} earthquake records after multiple retries`,
  //       );
  //     }
  //   }
  // }

  private async backoff(attempt: number): Promise<void> {
    const backoffMs = Math.min(1000 * attempt, 5000);
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
  }

  private buildListQuery(filters: EarthquakeQueryFilters): QueryCommandInput {
    const {
      limit = 20,
      startTime,
      endTime,
      minMagnitude,
      maxMagnitude,
      region,
      nextToken,
    } = filters;

    if (startTime && endTime && startTime > endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }
    if (
      typeof minMagnitude === 'number' &&
      typeof maxMagnitude === 'number' &&
      minMagnitude > maxMagnitude
    ) {
      throw new BadRequestException(
        'minMagnitude must be less than or equal to maxMagnitude',
      );
    }

    let exclusiveStartKey: Record<string, unknown> | undefined;
    if (nextToken) {
      try {
        exclusiveStartKey = decodePaginationToken(nextToken);
      } catch {
        throw new BadRequestException('Invalid pagination token');
      }
    }

    const attributeNames: Record<string, string> = {};
    const attributeValues: Record<string, unknown> = {};
    const filterExpressions: string[] = [];
    const keyConditions: string[] = [];
    let indexName: string | undefined;

    if (region) {
      indexName = REGION_GSI_NAME;
      attributeNames['#gsi1pk'] = 'gsi1pk';
      attributeValues[':region'] = region;
      keyConditions.push('#gsi1pk = :region');
      attributeNames['#sk'] = 'sk';

      if (startTime) {
        keyConditions.push('#sk >= :startTime');
        attributeValues[':startTime'] = startTime;
      }
      if (endTime) {
        keyConditions.push('#sk <= :endTime');
        attributeValues[':endTime'] = endTime;
      }

      if (typeof minMagnitude === 'number') {
        attributeNames['#magnitude'] = 'magnitude';
        attributeValues[':minMagFilter'] = minMagnitude;
        filterExpressions.push('#magnitude >= :minMagFilter');
      }
      if (typeof maxMagnitude === 'number') {
        attributeNames['#magnitude'] = 'magnitude';
        attributeValues[':maxMagFilter'] = maxMagnitude;
        filterExpressions.push('#magnitude <= :maxMagFilter');
      }
    } else {
      attributeNames['#pk'] = 'pk';
      attributeValues[':pk'] = EARTHQUAKE_TABLE_PK;
      keyConditions.push('#pk = :pk');

      if (
        typeof minMagnitude === 'number' ||
        typeof maxMagnitude === 'number'
      ) {
        indexName = MAGNITUDE_LSI_NAME;
        attributeNames['#magnitude'] = 'magnitude';

        if (
          typeof minMagnitude === 'number' &&
          typeof maxMagnitude === 'number'
        ) {
          keyConditions.push('#magnitude BETWEEN :minMag AND :maxMag');
          attributeValues[':minMag'] = minMagnitude;
          attributeValues[':maxMag'] = maxMagnitude;
        } else if (typeof minMagnitude === 'number') {
          keyConditions.push('#magnitude >= :minMag');
          attributeValues[':minMag'] = minMagnitude;
        } else if (typeof maxMagnitude === 'number') {
          keyConditions.push('#magnitude <= :maxMag');
          attributeValues[':maxMag'] = maxMagnitude;
        }

        if (startTime || endTime) {
          attributeNames['#eventTime'] = 'eventTime';
          if (startTime) {
            filterExpressions.push('#eventTime >= :startTimeFilter');
            attributeValues[':startTimeFilter'] = startTime;
          }
          if (endTime) {
            filterExpressions.push('#eventTime <= :endTimeFilter');
            attributeValues[':endTimeFilter'] = endTime;
          }
        }
      } else {
        attributeNames['#sk'] = 'sk';
        if (startTime) {
          keyConditions.push('#sk >= :startTime');
          attributeValues[':startTime'] = startTime;
        }
        if (endTime) {
          keyConditions.push('#sk <= :endTime');
          attributeValues[':endTime'] = endTime;
        }
      }
    }

    const query: QueryCommandInput = {
      TableName: this.earthquakeTable,
      Limit: limit,
      ExclusiveStartKey: exclusiveStartKey,
      ScanIndexForward: false,
      KeyConditionExpression: keyConditions.join(' AND '),
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    };

    if (indexName) {
      query.IndexName = indexName;
    }
    if (filterExpressions.length > 0) {
      query.FilterExpression = filterExpressions.join(' AND ');
    }

    return query;
  }

  private deriveRegion(place: string | null): string {
    if (!place) {
      return 'Unknown';
    }

    if (place.includes(',')) {
      const parts = place.split(',');
      return parts[parts.length - 1].trim() || 'Unknown';
    }

    if (place.includes(' of ')) {
      const [, regionPart] = place.split(' of ');
      return regionPart.trim() || 'Unknown';
    }

    return place.trim() || 'Unknown';
  }

  private getDayBucket(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toISOString().slice(0, 10);
  }
}
