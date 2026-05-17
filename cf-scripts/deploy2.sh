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
  "ecs.yaml:microservice-ecs"
  "alarms.yaml:microservice-alarms"
  "insights.yaml:microservice-insights"
  "xrays.yaml:microservice-xrays"
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

  # ==========================================================
  # Check current stack status
  # ==========================================================
  STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name $STACK \
    --query "Stacks[0].StackStatus" \
    --output text 2>/dev/null)

  echo "Current stack status: $STACK_STATUS"

  # ==========================================================
  # Handle failed rollback states automatically
  # ==========================================================
  if [[ "$STACK_STATUS" == "ROLLBACK_COMPLETE" ]] || \
     [[ "$STACK_STATUS" == "ROLLBACK_FAILED" ]] || \
     [[ "$STACK_STATUS" == "UPDATE_ROLLBACK_COMPLETE" ]] || \
     [[ "$STACK_STATUS" == "CREATE_FAILED" ]]; then

    echo "⚠️ Stack is in failed state."
    echo "🗑️ Deleting stack: $STACK"

    aws cloudformation delete-stack \
      --stack-name $STACK

    if [ $? -ne 0 ]; then
      echo "❌ Failed to initiate deletion for $STACK"
      exit 1
    fi

    echo "⏳ Waiting for stack deletion..."

    aws cloudformation wait stack-delete-complete \
      --stack-name $STACK

    if [ $? -ne 0 ]; then
      echo "❌ Stack deletion failed for $STACK"
      exit 1
    fi

    echo "✅ Stack deleted successfully"
  fi

  # ==========================================================
  # Deploy stack
  # ==========================================================
  aws cloudformation deploy \
    --template-file $TEMPLATE \
    --stack-name $STACK \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides Environment=$ENV \
    --no-fail-on-empty-changeset

  # ==========================================================
  # Stop if deployment fails
  # ==========================================================
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