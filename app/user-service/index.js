require('dotenv').config();
const express = require('express');
const { init } = require('./db');
const userRoutes = require('./routes');
 
const app = express();
const PORT = process.env.PORT || 3001;
 
app.use(express.json());
 
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'user-service' }));
app.use('/users', userRoutes);
 
const start = async () => {
  await init();
  app.listen(PORT, () => console.log(`[user-service] Running on port ${PORT}`));
};
 
start().catch(err => {
  console.error('[user-service] Startup error:', err);
  process.exit(1);
});
 