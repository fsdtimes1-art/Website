require('dotenv').config();
require('./services/reminderScheduler');
const express = require('express');
const cors    = require('cors');

const eventsRouter          = require('./routes/events');
const ticketsRouter         = require('./routes/tickets');
const adminRouter           = require('./routes/admin');
const portfolioRouter       = require('./routes/portfolio');
const paymentsRouter        = require('./routes/payments');
const physicalTicketsRouter = require('./routes/physicalTickets');

const app = express();

// Allow requests from both client and admin frontends
const allowedOrigins = [
  'https://faisalabadtimes.vercel.app',
  'https://www.faisalabadtimes.co',
  'https://faisalabadtimes.co',           // ← apex domain (no www)
  'https://faisalabadtimes-admin.vercel.app',
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

// The separate admin Vercel project uses branch-specific Preview URLs.
// Keep this narrowly scoped to that project so public or unrelated Vercel sites stay blocked.
const isTrustedAdminPreviewOrigin = (origin) =>
  /^https:\/\/website-git-[a-z0-9-]+-fsdtimes1-3083s-projects\.vercel\.app$/.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || isTrustedAdminPreviewOrigin(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

// Physical ticketing — admin-only, inline auth guard (mirrors admin.js key logic).
// Accepts key in 'x-admin-key' header OR '?key=' query param.
// The query param is needed for direct browser navigation (PDF download links)
// because browser GET requests don't send custom headers.
app.use('/api/admin/physical-tickets', (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (!key) return res.status(401).json({ error: 'Unauthorized' });
  const validKeys = [process.env.ADMIN_SECRET_KEY, process.env.ADMIN2_SECRET_KEY].filter(Boolean);
  if (!validKeys.includes(key)) return res.status(403).json({ error: 'Forbidden' });
  req.adminAccount = key === process.env.ADMIN_SECRET_KEY ? 'admin' : 'admin2';
  next();
}, physicalTicketsRouter);

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
