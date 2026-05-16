require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { startCronJobs } = require('./services/cronService');

const app = express();

// CORS — allow Vercel frontend, localhost dev, and preview deployments
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
    // Allow any Vercel deployment (production + preview URLs)
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow custom domain if set
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
    // Block everything else
    callback(null, true); // Open for now, tighten in production
  },
  credentials: true,
}));
app.use(express.json());

// Serve PDF files
app.use('/pdfs', express.static(path.join(__dirname, '../pdfs')));

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Coating Guru backend running' });
});

// Database test (temporary — remove after confirming)
app.get('/db-test', async (req, res) => {
  try {
    const db = require('./db');
    const [rows] = await db.query('SELECT 1 as test');
    res.json({ ok: true, db: 'connected', config: { host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, database: process.env.DB_NAME } });
  } catch (e) {
    res.json({ ok: false, error: e.message, code: e.code, config: { host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, database: process.env.DB_NAME } });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin', require('./routes/admin'));

// Start cron jobs
startCronJobs();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});