const {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require('@aws-sdk/client-sqs');

const client = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });

const QUEUE_URL       = process.env.SQS_QUEUE_URL;
const WAIT_TIME       = parseInt(process.env.SQS_WAIT_TIME_SECONDS || '20');

/**
 * Handles a single ORDER_PLACED event.
 * In production, replace the console.log with an SES email, SNS push, Slack webhook, etc.
 */
const handleOrderPlaced = (payload) => {
  const { order, user, product } = payload;
  console.log('─────────────────────────────────────────');
  console.log(`📦 ORDER CONFIRMED`);
  console.log(`   Order ID  : #${order.id}`);
  console.log(`   Customer  : ${user.name} <${user.email}>`);
  console.log(`   Product   : ${product.name} x${order.quantity}`);
  console.log(`   Total     : $${order.total}`);
  console.log(`   Status    : ${order.status}`);
  console.log(`   Placed at : ${order.createdAt}`);
  console.log('─────────────────────────────────────────');
};

/**
 * Long-poll loop — continuously polls SQS for new messages.
 * Uses long polling (WaitTimeSeconds) to reduce empty receives and AWS costs.
 */
const startConsumer = async () => {
  console.log('[notification-service] SQS consumer started, waiting for messages...');

  while (true) {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl:            QUEUE_URL,
        MaxNumberOfMessages: 10,       // process up to 10 at a time
        WaitTimeSeconds:     WAIT_TIME, // long polling
      });

      const response = await client.send(command);
      const messages = response.Messages || [];

      for (const message of messages) {
        try {
          const payload = JSON.parse(message.Body);

          if (payload.event === 'ORDER_PLACED') {
            handleOrderPlaced(payload);
          } else {
            console.warn(`[notification-service] Unknown event type: ${payload.event}`);
          }

          // Delete the message from the queue after successful processing
          await client.send(new DeleteMessageCommand({
            QueueUrl:      QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle,
          }));
        } catch (err) {
          // If processing fails, the message will become visible again after the visibility timeout
          console.error('[notification-service] Failed to process message:', err.message);
        }
      }
    } catch (err) {
      console.error('[notification-service] SQS receive error:', err.message);
      // Wait 5 seconds before retrying to avoid hammering SQS on persistent errors
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

module.exports = { startConsumer };