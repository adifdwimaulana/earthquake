import { ALLOWED_FILTERS, EARTHQUAKE_FEATURE } from '@/shared/constant';
import { ForbiddenFilterException } from '@/shared/exception';
import { MessageResponse } from '@/shared/model';
import {
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestLogContext } from '../request-log/request-log.decorator';
import { RequestLoggingInterceptor } from '../request-log/request-logging.interceptor';
import { EarthquakeListResponse, EarthquakeQuery } from './earthquake.dto';
import { EarthquakeFeature } from './earthquake.model';
import { EarthquakeService } from './earthquake.service';

@Controller('earthquakes')
@ApiTags('Earthquakes')
export class EarthquakeController {
  constructor(private readonly earthquakeService: EarthquakeService) {}

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
    example: {
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid filters provided',
      allowedFilters: ALLOWED_FILTERS,
    },
  })
  async getEarthquakes(
    @Query() query: EarthquakeQuery,
  ): Promise<EarthquakeListResponse> {
    return await this.earthquakeService.getEarthquakes(query);
  }

  @Get('/:eventId')
  @UseInterceptors(RequestLoggingInterceptor)
  @RequestLogContext('/earthquakes/:eventId')
  @ApiOperation({ summary: 'Get earthquake details by event ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Earthquake details',
    type: EarthquakeFeature,
    example: EARTHQUAKE_FEATURE,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Earthquake not found',
    type: NotFoundException,
    example: {
      statusCode: 404,
      message: 'Earthquake with eventId 12345 not found',
      error: 'Not Found',
    },
  })
  async getByEventId(
    @Param('eventId') eventId: string,
  ): Promise<EarthquakeFeature> {
    return await this.earthquakeService.getByEventId(eventId);
  }
}
