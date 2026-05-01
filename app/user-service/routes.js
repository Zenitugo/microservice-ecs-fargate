const router = require('express').Router();
const { pool } = require('./db');

// List all users
router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  res.json({ service: 'user-service', data: rows });
});

// Get a single user — called internally by order-service
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json({ service: 'user-service', data: rows[0] });
});

// Register a user
router.post('/', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' });

  const { rows } = await pool.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    [name, email]
  );
  res.status(201).json({ service: 'user-service', data: rows[0] });
});

// Delete a user
router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'User not found' });
  res.json({ service: 'user-service', message: 'User deleted' });
});

module.exports = router;