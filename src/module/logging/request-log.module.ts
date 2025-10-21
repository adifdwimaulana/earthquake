import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamoModule } from '@/module/dynamo/dynamo.module';
import { RequestLogService } from './request-log.service';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

@Module({
  imports: [ConfigModule, DynamoModule],
  providers: [RequestLogService, RequestLoggingInterceptor],
  exports: [RequestLogService, RequestLoggingInterceptor],
})
export class RequestLogModule {}
