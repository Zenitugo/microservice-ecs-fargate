#!/bin/bash

# ============================================================
# destroy.sh - Delete all CloudFormation stacks
# Usage: ./destroy.sh dev
#        ./destroy.sh prod
#
# Stacks are deleted in REVERSE order to respect dependencies
# e.g. iam must be deleted before sqs since iam imports from sqs
# ============================================================

ENV=${1}

# Validate environment argument was provided
if [ -z "$ENV" ]; then
  echo "❌ Please provide an environment."
  echo "Usage: ./destroy.sh dev"
  echo "Usage: ./destroy.sh prod"
  exit 1
fi

# Validate environment is one of the allowed values
if [ "$ENV" != "dev" ] && [ "$ENV" != "staging" ] && [ "$ENV" != "prod" ]; then
  echo "❌ Invalid environment: $ENV"
  echo "Allowed values: dev, staging, prod"
  exit 1
fi

# ============================================================
# Safety confirmation - destroying infrastructure is serious
# ============================================================
echo ""
echo "⚠️  WARNING: You are about to destroy ALL microservice stacks"
echo "   Environment: $ENV"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Destroy cancelled."
  exit 0
fi

echo ""
echo "==========================================="
echo " Destroying all stacks in: $ENV"
echo " Deleting in reverse order..."
echo "==========================================="

# ============================================================
# STACK LIST - in REVERSE deployment order
# Last deployed = first deleted
# ============================================================
STACKS=(
  "microservice-xrays"
  "microservice-insights"
  "microservice-alarms"
  "microservice-logging"
  "microservice-ecs"
  "microservice-lb"
  "microservice-rds"
  "microservice-iam"
  "microservice-sqs"
  "microservice-secrets"
  "microservice-ecr"
  "microservice-sg"
  "microservice-network"
)

# ============================================================
# LOOP - delete each stack and wait for completion
# ============================================================
for STACK in "${STACKS[@]}"; do
  echo ""
  echo "-------------------------------------------"
  echo " Deleting stack: $STACK"
  echo "-------------------------------------------"

  # Check if stack exists before trying to delete
  STATUS=$(aws cloudformation describe-stacks \
    --stack-name $STACK \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null)

  if [ -z "$STATUS" ]; then
    echo "⏭️  $STACK does not exist. Skipping."
    continue
  fi

  # If stack is already in ROLLBACK_COMPLETE delete it
  echo "Current status: $STATUS"

  # Initiate stack deletion
  aws cloudformation delete-stack \
    --stack-name $STACK

  if [ $? -ne 0 ]; then
    echo "❌ Failed to initiate deletion of $STACK"
    exit 1
  fi

  # Wait for deletion to complete
  echo "Waiting for $STACK to be deleted..."
  aws cloudformation wait stack-delete-complete \
    --stack-name $STACK

  if [ $? -ne 0 ]; then
    echo "❌ Failed to delete $STACK"
    echo "Run this to see why:"
    echo "aws cloudformation describe-stack-events --stack-name $STACK --output table"
    exit 1
  fi

  echo "✅ $STACK deleted successfully"
done

echo ""
echo "==========================================="
echo " ✅ All stacks destroyed in $ENV!"
echo "==========================================="