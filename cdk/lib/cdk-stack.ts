import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import type { Construct } from 'constructs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const earthquakeTable = new dynamodb.Table(this, 'EarthquakeTable', {
      tableName: 'earthquake',
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const addGlobalSecondaryIndex = (
      table: dynamodb.Table,
      indexName: string,
      partitionKey: { name: string; type: dynamodb.AttributeType },
      sortKey?: { name: string; type: dynamodb.AttributeType },
    ) =>
      table.addGlobalSecondaryIndex({
        indexName,
        partitionKey,
        sortKey,
        projectionType: dynamodb.ProjectionType.ALL,
      });

    addGlobalSecondaryIndex(
      earthquakeTable,
      'GSI_Time',
      { name: 'globalTime', type: dynamodb.AttributeType.STRING },
      { name: 'time', type: dynamodb.AttributeType.NUMBER },
    );

    addGlobalSecondaryIndex(
      earthquakeTable,
      'GSI_Magnitude',
      {
        name: 'globalMag',
        type: dynamodb.AttributeType.STRING,
      },
      { name: 'magScaled', type: dynamodb.AttributeType.NUMBER },
    );

    addGlobalSecondaryIndex(
      earthquakeTable,
      'GSI_Location_Magnitude',
      {
        name: `location`,
        type: dynamodb.AttributeType.STRING,
      },
      { name: 'magScaled', type: dynamodb.AttributeType.NUMBER },
    );

    addGlobalSecondaryIndex(
      earthquakeTable,
      'GSI_Status_Time',
      { name: 'status', type: dynamodb.AttributeType.STRING },
      { name: 'time', type: dynamodb.AttributeType.NUMBER },
    );

    addGlobalSecondaryIndex(
      earthquakeTable,
      'GSI_Tsunami_Time',
      {
        name: 'tsunami',
        type: dynamodb.AttributeType.NUMBER,
      },
      {
        name: 'time',
        type: dynamodb.AttributeType.NUMBER,
      },
    );

    const logTable = new dynamodb.Table(this, 'LogTable', {
      tableName: 'log',
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, 'EarthquakeTableArn', {
      value: earthquakeTable.tableArn,
    });
    new cdk.CfnOutput(this, 'LogTableArn', {
      value: logTable.tableArn,
    });
  }
}
