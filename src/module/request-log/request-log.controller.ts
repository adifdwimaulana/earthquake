import {
  Controller,
  Get,
  HttpStatus,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestLogContext } from './request-log.decorator';
import { RequestCountQuery, RequestCountResponse } from './request-log.dto';
import { RequestLogService } from './request-log.service';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

@Controller('analytics')
@ApiTags('Analytics')
export class RequestLogController {
  constructor(private readonly requestLogService: RequestLogService) {}

  @Get('request-per-day')
  @UseInterceptors(RequestLoggingInterceptor)
  @RequestLogContext('/analytics/request-per-day')
  @ApiOperation({
    summary: 'Get request count per endpoint for a specific day',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: RequestCountResponse,
  })
  async getRequestCountByEndpoint(@Query() query: RequestCountQuery) {
    return await this.requestLogService.getRequestCountPerDay(query);
  }
}
