import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { EarthquakeModule } from '@/module/earthquake/earthquake.module';
import { RequestLogModule } from '@/module/request-log/request-log.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), EarthquakeModule, RequestLogModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
