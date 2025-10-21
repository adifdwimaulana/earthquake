import { SetMetadata } from '@nestjs/common';

export const REQUEST_LOG_CONTEXT = 'REQUEST_LOG_CONTEXT';

export const RequestLogContext = (context: string) =>
  SetMetadata(REQUEST_LOG_CONTEXT, context);
