require('dotenv').config();
const express = require('express');
const { init } = require('./db');
const orderRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'order-service' }));
app.use('/orders', orderRoutes);

const start = async () => {
  await init();
  app.listen(PORT, () => console.log(`[order-service] Running on port ${PORT}`));
};

start().catch(err => {
  console.error('[order-service] Startup error:', err);
  process.exit(1);
});