import { DynamoModule } from '@/module/dynamo/dynamo.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RequestLogController } from './request-log.controller';
import { RequestLogService } from './request-log.service';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

@Module({
  imports: [ConfigModule, DynamoModule],
  providers: [RequestLogService, RequestLoggingInterceptor],
  controllers: [RequestLogController],
  exports: [RequestLogService, RequestLoggingInterceptor],
})
export class RequestLogModule {}
