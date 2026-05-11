require('dotenv').config();
const express = require('express');
const { init } = require('./db');
const productRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'product-service' }));
app.use('/products', productRoutes);

const start = async () => {
  await init();
  app.listen(PORT, () => console.log(`[product-service] Running on port ${PORT}`));
};

start().catch(err => {
  console.error('[product-service] Startup error:', err);
  process.exit(1);
});