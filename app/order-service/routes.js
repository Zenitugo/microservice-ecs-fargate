const router  = require('express').Router();
const axios   = require('axios');
const { pool } = require('./db');
const { publishOrderEvent } = require('./sqs');

const USER_SERVICE_URL    = process.env.USER_SERVICE_URL;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;

// List all orders
router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  res.json({ service: 'order-service', data: rows });
});

// Get a single order
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Order not found' });
  res.json({ service: 'order-service', data: rows[0] });
});

// Place an order
// This is the core flow: validate user → validate product → save order → publish SQS event
router.post('/', async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  if (!user_id || !product_id || !quantity) {
    return res.status(400).json({ error: 'user_id, product_id, and quantity are required' });
  }

  // Step 1 — Validate user exists (calls user-service via Cloud Map DNS)
  let user;
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users/${user_id}`);
    user = response.data.data;
  } catch (err) {
    const status = err.response?.status;
    if (status === 404) return res.status(404).json({ error: 'User not found' });
    console.error('[order-service] Error calling user-service:', err.message);
    return res.status(502).json({ error: 'Could not reach user-service' });
  }

  // Step 2 — Validate product and check stock (calls product-service via Cloud Map DNS)
  let product;
  try {
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/products/${product_id}`);
    product = response.data.data;
  } catch (err) {
    const status = err.response?.status;
    if (status === 404) return res.status(404).json({ error: 'Product not found' });
    console.error('[order-service] Error calling product-service:', err.message);
    return res.status(502).json({ error: 'Could not reach product-service' });
  }

  if (product.stock < quantity) {
    return res.status(409).json({ error: `Insufficient stock. Available: ${product.stock}` });
  }

  // Step 3 — Decrement stock atomically in product-service
  try {
    await axios.patch(`${PRODUCT_SERVICE_URL}/products/${product_id}/stock/decrement`, { quantity });
  } catch (err) {
    const msg = err.response?.data?.error || err.message;
    return res.status(409).json({ error: `Stock update failed: ${msg}` });
  }

  // Step 4 — Save order to orders_db
  const total = (parseFloat(product.price) * quantity).toFixed(2);
  const { rows } = await pool.query(
    'INSERT INTO orders (user_id, product_id, quantity, total) VALUES ($1, $2, $3, $4) RETURNING *',
    [user_id, product_id, quantity, total]
  );
  const order = rows[0];

  // Step 5 — Publish ORDER_PLACED event to SQS (non-blocking)
  publishOrderEvent(order, user, product).catch(err => {
    console.error('[order-service] SQS publish failed (order still saved):', err.message);
  });

  res.status(201).json({ service: 'order-service', data: order });
});

module.exports = router;