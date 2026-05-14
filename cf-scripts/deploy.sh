#!/bin/bash

# ============================================================
# deploy.sh - Deploy all CloudFormation stacks
# Usage: ./deploy.sh dev
#        ./deploy.sh prod
#        ./deploy.sh staging
# ============================================================

# Take environment as argument
ENV=${1}

# Validate environment argument was provided
if [ -z "$ENV" ]; then
  echo "❌ Please provide an environment."
  echo "Usage: ./deploy.sh dev"
  echo "Usage: ./deploy.sh prod"
  echo "Usage: ./deploy.sh staging"
  exit 1
fi

# Validate environment is one of the allowed values
if [ "$ENV" != "dev" ] && [ "$ENV" != "staging" ] && [ "$ENV" != "prod" ]; then
  echo "❌ Invalid environment: $ENV"
  echo "Allowed values: dev, staging, prod"
  exit 1
fi

echo "==========================================="
echo " Deploying all stacks to: $ENV"
echo "==========================================="

# ============================================================
# STACK LIST - template file:stack name
# Order matters - each stack may depend on the previous one
# ============================================================
STACKS=(
  "network.yaml:microservice-network"
  "sg.yaml:microservice-sg"
  "ecr.yaml:microservice-ecr"
  "secrets.yaml:microservice-secrets"
  "sqs.yaml:microservice-sqs"
  "rds.yaml:microservice-rds"
  "iam.yaml:microservice-iam"
  "lb.yaml:microservice-lb"
  "logging.yaml:microservice-logging"
)

# ============================================================
# LOOP through each stack and deploy
# ============================================================
for entry in "${STACKS[@]}"; do
  TEMPLATE=$(echo $entry | cut -d: -f1)  # left side of :
  STACK=$(echo $entry | cut -d: -f2)     # right side of :

  echo ""
  echo "-------------------------------------------"
  echo " Template:  $TEMPLATE"
  echo " Stack:     $STACK"
  echo " Environment: $ENV"
  echo "-------------------------------------------"

  aws cloudformation deploy \
    --template-file $TEMPLATE \
    --stack-name $STACK \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides Environment=$ENV \
    --no-fail-on-empty-changeset

  # Check if deployment failed and stop if so
  if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to deploy $STACK. Stopping deployment."
    exit 1
  fi

  echo "✅ $STACK deployed successfully"
done

echo ""
echo "==========================================="
echo " ✅ All stacks deployed to $ENV successfully!"
echo "==========================================="