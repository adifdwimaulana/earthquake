import { DynamoDbProvider } from '@/module/dynamo/dynamo.provider';
import { RequestLogModule } from '@/module/request-log/request-log.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EarthquakeController } from './earthquake.controller';
import { EarthquakeService } from './earthquake.service';

@Module({
  imports: [ConfigModule, RequestLogModule],
  controllers: [EarthquakeController],
  providers: [EarthquakeService, DynamoDbProvider],
})
export class EarthquakeModule {}
