require('dotenv').config();
require('./services/reminderScheduler');
const express = require('express');
const cors    = require('cors');

const eventsRouter    = require('./routes/events');
const ticketsRouter   = require('./routes/tickets');
const adminRouter     = require('./routes/admin');
const portfolioRouter = require('./routes/portfolio');
const paymentsRouter  = require('./routes/payments');

const app = express();

// Allow requests from both client and admin frontends
const allowedOrigins = [
  'https://faisalabadtimes.vercel.app',
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
}));

// Handle preflight requests for all routes
app.options('*', cors());

// Raw body for Lemon Squeezy webhook signature verification
// Must come BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// Routes
app.use('/api/events',    eventsRouter);
app.use('/api/tickets',   ticketsRouter);
app.use('/api/admin',     adminRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/payments',  paymentsRouter);

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