import { RequestLogService } from '@/module/logging/request-log.service';
import { ForbiddenFilterException } from '@/shared/exception';
import { MessageResponse } from '@/shared/model';
import {
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestLogContext } from '../logging/request-log.decorator';
import { RequestLoggingInterceptor } from '../logging/request-logging.interceptor';
import { EarthquakeListResponse, EarthquakeQuery } from './earthquake.dto';
import { EarthquakeService } from './earthquake.service';

@Controller('earthquakes')
@ApiTags('Earthquakes')
export class EarthquakeController {
  constructor(
    private readonly earthquakeService: EarthquakeService,
    private readonly requestLogService: RequestLogService,
  ) {}

  @Post('ingest')
  @UseInterceptors(RequestLoggingInterceptor)
  @RequestLogContext('/earthquakes/ingest')
  @ApiOperation({ summary: 'Ingest earthquake data from USGS API' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: MessageResponse,
  })
  async ingestEarthquakeData(): Promise<MessageResponse> {
    return await this.earthquakeService.ingestEarthquakeData();
  }

  @Get()
  @UseInterceptors(RequestLoggingInterceptor)
  @RequestLogContext('/earthquakes')
  @ApiOperation({ summary: 'Get earthquakes based on query parameters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of earthquakes matching the query',
    type: EarthquakeListResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
    type: ForbiddenFilterException,
  })
  async getEarthquakes(
    @Query() query: EarthquakeQuery,
  ): Promise<EarthquakeListResponse> {
    return await this.earthquakeService.getEarthquakes(query);
  }
}
