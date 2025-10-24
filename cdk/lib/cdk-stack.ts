import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import type { Construct } from 'constructs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const earthquakeTable = new dynamodb.Table(this, 'EarthquakeTable', {
      tableName: 'earthquake',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'time', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const addGlobalSecondaryIndex = (
      table: dynamodb.Table,
      indexName: string,
      pk: { name: string; type: dynamodb.AttributeType },
      sk?: { name: string; type: dynamodb.AttributeType },
    ) =>
      table.addGlobalSecondaryIndex({
        indexName,
        partitionKey: pk,
        sortKey: sk,
        projectionType: dynamodb.ProjectionType.ALL,
      });

    addGlobalSecondaryIndex(
      earthquakeTable,
      'GSI_Latest',
      { name: 'allKey', type: dynamodb.AttributeType.STRING },
      { name: 'time', type: dynamodb.AttributeType.NUMBER },
    );

    addGlobalSecondaryIndex(
      earthquakeTable,
      'GSI_LocationTime',
      { name: 'location', type: dynamodb.AttributeType.STRING },
      { name: 'time', type: dynamodb.AttributeType.NUMBER },
    );

    addGlobalSecondaryIndex(
      earthquakeTable,
      'GSI_TsunamiTime',
      { name: 'tsunami', type: dynamodb.AttributeType.NUMBER },
      { name: 'time', type: dynamodb.AttributeType.NUMBER },
    );

    addGlobalSecondaryIndex(
      earthquakeTable,
      'GSI_LocationTsunamiTime',
      { name: 'locationTsunami', type: dynamodb.AttributeType.STRING },
      { name: 'time', type: dynamodb.AttributeType.NUMBER },
    );

    addGlobalSecondaryIndex(
      earthquakeTable,
      'GSI_Mag',
      { name: 'magBucket', type: dynamodb.AttributeType.STRING },
      { name: 'mag', type: dynamodb.AttributeType.NUMBER },
    );

    const logTable = new dynamodb.Table(this, 'LogTable', {
      tableName: 'log',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
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
