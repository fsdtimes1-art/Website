require('dotenv').config();
const express = require('express');
const cors = require('cors');

const eventsRouter    = require('./routes/events');
const ticketsRouter   = require('./routes/tickets');
const adminRouter     = require('./routes/admin');
const portfolioRouter = require('./routes/portfolio');
const paymentsRouter = require('./routes/payments');

const app = express();

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    process.env.ADMIN_URL  || 'http://localhost:5174'
  ],
  credentials: true
}));

// Raw body needed for Lemon Squeezy webhook signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
// Routes
app.use('/api/events',    eventsRouter);
app.use('/api/tickets',   ticketsRouter);
app.use('/api/admin',     adminRouter);
app.use('/api/portfolio', portfolioRouter);
// IMPORTANT: raw body parser for webhook must come BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Then your regular JSON middleware
app.use(express.json());

const paymentsRouter = require('./routes/payments');
app.use('/api/payments', paymentsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n🚀 EventFlow server running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });
}

module.exports = app;