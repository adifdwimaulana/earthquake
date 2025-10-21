import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';

export const DYNAMODB_CLIENT = 'DYNAMODB_CLIENT';

export const DynamoDbProvider = {
  provide: DYNAMODB_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const client = new DynamoDBClient({
      region: configService.get('AWS_REGION'),
      endpoint: configService.get('DYNAMODB_ENDPOINT'),
    });
    return DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  },
};
