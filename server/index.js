import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import itemsRouter from './routes/items.js';
import outgoingRouter from './routes/outgoing.js';
import borrowRouter from './routes/borrow.js';
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';
import settingsRouter from './routes/settings.js';

// Import database to ensure it initializes
import './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/items', itemsRouter);
app.use('/api/outgoing', outgoingRouter);
app.use('/api/borrow', borrowRouter);
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[Server] Inventory RND API running on http://localhost:${PORT}`);
});
