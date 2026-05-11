const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const init = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity   INTEGER NOT NULL,
      total      NUMERIC(10,2) NOT NULL,
      status     VARCHAR(50) NOT NULL DEFAULT 'confirmed',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('[order-service] Database ready');
};

module.exports = { pool, init };