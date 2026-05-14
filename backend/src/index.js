require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { startCronJobs } = require('./services/cronService');

const app = express();

app.use(cors());
app.use(express.json());

// Serve PDF files
app.use('/pdfs', express.static(path.join(__dirname, '../pdfs')));

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Coating Guru backend running' });
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