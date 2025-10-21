import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamoDbProvider } from './dynamo.provider';

@Module({
  imports: [ConfigModule],
  providers: [DynamoDbProvider],
  exports: [DynamoDbProvider],
})
export class DynamoModule {}
