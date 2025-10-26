import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import type { Construct } from 'constructs';

interface SecondaryIndex {
  table: dynamodb.Table;
  indexName: string;
  partitionKey: { name: string; type: dynamodb.AttributeType };
  sortKey?: { name: string; type: dynamodb.AttributeType };
  projectionType?: dynamodb.ProjectionType;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const earthquakeTable = new dynamodb.Table(this, 'EarthquakeTable', {
      tableName: 'earthquake',
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const addGlobalSecondaryIndex = (index: SecondaryIndex) => {
      const { table, indexName, partitionKey, sortKey, projectionType } = index;

      return table.addGlobalSecondaryIndex({
        indexName,
        partitionKey,
        sortKey,
        projectionType,
      });
    };

    addGlobalSecondaryIndex({
      table: earthquakeTable,
      indexName: 'GSI_Time',
      partitionKey: { name: 'globalTime', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'time', type: dynamodb.AttributeType.NUMBER },
    });

    addGlobalSecondaryIndex({
      table: earthquakeTable,
      indexName: 'GSI_Magnitude',
      partitionKey: { name: 'globalMag', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'magScaled', type: dynamodb.AttributeType.NUMBER },
    });

    addGlobalSecondaryIndex({
      table: earthquakeTable,
      indexName: 'GSI_Location_Magnitude',
      partitionKey: {
        name: `location`,
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'magScaled', type: dynamodb.AttributeType.NUMBER },
    });

    addGlobalSecondaryIndex({
      table: earthquakeTable,
      indexName: 'GSI_Tsunami_Time',
      partitionKey: {
        name: 'tsunami',
        type: dynamodb.AttributeType.NUMBER,
      },
      sortKey: {
        name: 'time',
        type: dynamodb.AttributeType.NUMBER,
      },
    });

    const requestLogTable = new dynamodb.Table(this, 'RequestLogTable', {
      tableName: 'log',
      partitionKey: {
        name: 'requestLogId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    addGlobalSecondaryIndex({
      table: requestLogTable,
      indexName: 'GSI_DayBucket_Endpoint',
      partitionKey: { name: 'dayBucket', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'endpoint', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.KEYS_ONLY,
    });

    addGlobalSecondaryIndex({
      table: requestLogTable,
      indexName: 'GSI_MonthBucket_Magnitude',
      partitionKey: {
        name: 'monthBucket',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'magScaled', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.KEYS_ONLY,
    });

    new cdk.CfnOutput(this, 'EarthquakeTableArn', {
      value: earthquakeTable.tableArn,
    });
    new cdk.CfnOutput(this, 'RequestLogTableArn', {
      value: requestLogTable.tableArn,
    });
  }
}
