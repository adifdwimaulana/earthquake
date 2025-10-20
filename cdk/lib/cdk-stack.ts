import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import type { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// DynamoDB Tables
		const earthquakeTable = new dynamodb.Table(this, "Earthquake", {
			tableName: "Earthquake",
			partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		const metadataTable = new dynamodb.Table(this, "Metadata", {
			tableName: "Metadata",
			partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		// IAM role for Lambda
		const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
			assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
			managedPolicies: [
				iam.ManagedPolicy.fromAwsManagedPolicyName(
					"service-role/AWSLambdaBasicExecutionRole",
				),
			],
		});

		earthquakeTable.grantReadWriteData(lambdaRole);
		metadataTable.grantReadWriteData(lambdaRole);

		// Lambda function
		const lambdaFn = new lambda.Function(this, "EarthquakeFetcher", {
			runtime: lambda.Runtime.NODEJS_20_X,
			code: lambda.Code.fromInline(`
		    exports.handler = async (event) => {
		      console.log("Event received:", event);
		      return { statusCode: 200, body: JSON.stringify({ message: "OK" }) };
		    };
		  `),
			handler: "index.handler",
			role: lambdaRole,
			environment: {
				TABLE_NAME: earthquakeTable.tableName,
			},
		});

		// Outputs
		new cdk.CfnOutput(this, "EarthquakeFetcherOutput", {
			value: lambdaFn.functionArn,
		});
		new cdk.CfnOutput(this, "EarthquakeTableOutput", {
			value: earthquakeTable.tableArn,
		});
		new cdk.CfnOutput(this, "MetadataTableOutput", {
			value: metadataTable.tableArn,
		});
	}
}
