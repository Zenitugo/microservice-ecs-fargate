require('dotenv').config();
const express = require('express');
const { startConsumer } = require('./consumer');

const app  = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

// Health check — ECS needs this even for worker services
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'notification-service' }));

// Start the HTTP server (for health checks) and the SQS consumer in parallel
app.listen(PORT, () => {
  console.log(`[notification-service] Health check listening on port ${PORT}`);
  startConsumer();
});