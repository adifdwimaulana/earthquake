import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamoModule } from '@/module/dynamo/dynamo.module';
import { RequestLogModule } from '@/module/logging/request-log.module';
import { EarthquakeController } from './earthquake.controller';
import { EarthquakeService } from './earthquake.service';

@Module({
  imports: [ConfigModule, DynamoModule, RequestLogModule],
  controllers: [EarthquakeController],
  providers: [EarthquakeService],
})
export class EarthquakeModule {}
