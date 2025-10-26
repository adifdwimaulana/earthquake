import { REQUEST_COUNT_BY_ENDPOINT } from '@/shared/constant';
import { dateToISODateString } from '@/shared/util';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class RequestCountQuery {
  @ApiProperty({
    description: 'List of API endpoints to filter the total requests',
    required: false,
    example: '/earthquake',
  })
  @IsString()
  @IsOptional()
  endpoint: string;

  @ApiProperty({
    description: 'Date to filter the total requests (YYYY-MM-DD)',
    required: false,
    example: dateToISODateString(new Date()),
  })
  @IsDate()
  @IsOptional()
  date: Date = new Date();
}

export class RequestCountData {
  constructor(endpoint: string, total: number) {
    this.endpoint = endpoint;
    this.total = total;
  }

  @ApiProperty({
    description: 'API endpoint',
    example: '/earthquakes',
  })
  @IsString()
  endpoint: string;

  @ApiProperty({
    description: 'Total number of requests for the endpoint',
    example: 20,
  })
  @IsNumber()
  total: number;
}

export class RequestCountResponse {
  @ApiProperty({
    description: 'Array of request count data per endpoint',
    type: [RequestCountData],
    example: REQUEST_COUNT_BY_ENDPOINT,
  })
  @Type(() => RequestCountData)
  @ValidateNested({ each: true })
  data: RequestCountData[];
}
