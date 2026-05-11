const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const client = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Publishes an order-placed event to SQS.
 * The notification-service will consume this message.
 */
const publishOrderEvent = async (order, user, product) => {
  const payload = {
    event: 'ORDER_PLACED',
    timestamp: new Date().toISOString(),
    order: {
      id:        order.id,
      quantity:  order.quantity,
      total:     order.total,
      status:    order.status,
      createdAt: order.created_at,
    },
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
    },
    product: {
      id:    product.id,
      name:  product.name,
      price: product.price,
    },
  };

  const command = new SendMessageCommand({
    QueueUrl:    process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify(payload),
  });

  await client.send(command);
  console.log(`[order-service] Published ORDER_PLACED event for order #${order.id}`);
};

module.exports = { publishOrderEvent };