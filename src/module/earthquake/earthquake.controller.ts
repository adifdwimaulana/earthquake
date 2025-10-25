import { RequestLogService } from '@/module/logging/request-log.service';
import { MessageResponse } from '@/shared/model';
import { Controller, Post, UseInterceptors } from '@nestjs/common';
import { RequestLogContext } from '../logging/request-log.decorator';
import { RequestLoggingInterceptor } from '../logging/request-logging.interceptor';
import { EarthquakeService } from './earthquake.service';

@Controller('earthquakes')
export class EarthquakeController {
  constructor(
    private readonly earthquakeService: EarthquakeService,
    private readonly requestLogService: RequestLogService,
  ) {}

  @Post('ingest')
  @UseInterceptors(RequestLoggingInterceptor)
  @RequestLogContext('/earthquakes/ingest')
  async ingestEarthquakeData(): Promise<MessageResponse> {
    return await this.earthquakeService.ingestEarthquakeData();
  }

  //   @Get()
  //   @UseInterceptors(RequestLoggingInterceptor)
  //   @RequestLogContext('/earthquake')
  //   async listEarthquakes(
  //     @Query() query: ListEarthquakeQueryDto,
  //   ): Promise<EarthquakeListResponse> {
  //     const result = await this.earthquakeService.listEarthquakes(query);
  //     return {
  //       count: result.count,
  //       nextToken: result.nextToken,
  //       items: result.items.map(mapEarthquakeItemToResponse),
  //     };
  //   }

  //   @Get('metrics/requests')
  //   async getRequestMetrics(@Query() query: RequestMetricsQueryDto) {
  //     const metrics = await this.requestLogService.getRequestCountsByDay({
  //       startTime: query.startTime,
  //       endTime: query.endTime,
  //       endpoints: query.endpoint ? [query.endpoint] : undefined,
  //     });

  //     const aggregated =
  //       query.interval === 'week'
  //         ? this.aggregateWeekly(metrics)
  //         : metrics.map((point) => ({ bucket: point.day, value: point.value }));

  //     const total = aggregated.reduce((sum, point) => sum + point.value, 0);

  //     return {
  //       interval: query.interval,
  //       total,
  //       points: aggregated,
  //     };
  //   }

  //   private aggregateWeekly(points: { day: string; value: number }[]) {
  //     const buckets = new Map<string, number>();

  //     for (const point of points) {
  //       const weekBucket = this.getWeekBucket(point.day);
  //       buckets.set(weekBucket, (buckets.get(weekBucket) ?? 0) + point.value);
  //     }

  //     return Array.from(buckets.entries())
  //       .map(([bucket, value]) => ({ bucket, value }))
  //       .sort((a, b) => (a.bucket < b.bucket ? -1 : 1));
  //   }

  //   private getWeekBucket(day: string): string {
  //     const date = new Date(`${day}T00:00:00.000Z`);
  //     const currentDay = date.getUTCDay();
  //     const diff = (currentDay + 6) % 7; // convert Sunday-based to Monday-based week
  //     date.setUTCDate(date.getUTCDate() - diff);
  //     return date.toISOString().slice(0, 10);
  //   }
}
