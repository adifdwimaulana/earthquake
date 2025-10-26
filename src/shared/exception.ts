import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import { ALLOWED_FILTERS } from './constant';

export class ForbiddenFilterException extends BadRequestException {
  constructor(message: string, allowedFilters?: string[]) {
    super({
      statusCode: 400,
      error: 'Bad Request',
      message,
      allowedFilters,
    });
  }

  @ApiProperty({
    description: 'List of allowed filters',
    example: ALLOWED_FILTERS,
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  allowedFilters?: string[];
}
