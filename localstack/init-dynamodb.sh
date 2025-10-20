# #!/bin/bash
# set -e

# echo "Initializing DynamoDB tables..."

# # Create earthquake table
# awslocal dynamodb create-table \
#   --table-name earthquake \
#   --attribute-definitions \
#     AttributeName=id,AttributeType=S \
#   --key-schema \
#     AttributeName=id,KeyType=HASH \
#   --provisioned-throughput \
#     ReadCapacityUnits=5,WriteCapacityUnits=5

# # Create metadata table
# awslocal dynamodb create-table \
#   --table-name metadata \
#   --attribute-definitions \
#     AttributeName=generated,AttributeType=N \
#   --key-schema \
#     AttributeName=generated,KeyType=HASH \
#   --provisioned-throughput \
#     ReadCapacityUnits=1,WriteCapacityUnits=1

# echo "DynamoDB tables 'earthquake' and 'metadata' created successfully!"
