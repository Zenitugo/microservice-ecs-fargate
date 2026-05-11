const router = require('express').Router();
const { pool } = require('./db');

// List all products
router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
  res.json({ service: 'product-service', data: rows });
});

// Get a single product — called internally by order-service
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Product not found' });
  res.json({ service: 'product-service', data: rows[0] });
});

// Create a product
router.post('/', async (req, res) => {
  const { name, price, stock } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'name and price are required' });

  const { rows } = await pool.query(
    'INSERT INTO products (name, price, stock) VALUES ($1, $2, $3) RETURNING *',
    [name, price, stock ?? 0]
  );
  res.status(201).json({ service: 'product-service', data: rows[0] });
});

// Decrement stock — called internally by order-service after a successful order
router.patch('/:id/stock/decrement', async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity must be >= 1' });

  const { rows } = await pool.query(
    `UPDATE products
     SET stock = stock - $1
     WHERE id = $2 AND stock >= $1
     RETURNING *`,
    [quantity, req.params.id]
  );
  if (!rows.length) return res.status(409).json({ error: 'Insufficient stock or product not found' });
  res.json({ service: 'product-service', data: rows[0] });
});

// Delete a product
router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Product not found' });
  res.json({ service: 'product-service', message: 'Product deleted' });
});

module.exports = router;