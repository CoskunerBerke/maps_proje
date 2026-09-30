import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Import routers
import placesRouter from './routes/places';
import businessesRouter from './routes/businesses';
import settingsRouter from './routes/settings';
import statisticsRouter from './routes/statistics';
import excludedBrandsRouter from './routes/excludedBrands';
import sessionsRouter from './routes/sessions';
import { localOnly, parseAllowedHosts } from './utils/localOnly';

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;
// Local single-user tool: listen on the loopback interface only by default.
// Do NOT expose this server to a network - it has no login system.
const HOST = process.env.HOST || '127.0.0.1';
const ALLOWED_HOSTS = parseAllowedHosts(process.env.ALLOWED_HOSTS);

// Reject requests with a non-local Host header (DNS rebinding) or a foreign Origin (CSRF)
app.use(localOnly(ALLOWED_HOSTS));

// CORS setup: Only allow the local frontend URL (http://localhost:5173)
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  })
);

app.use(express.json());

// Simple custom rate limiting middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;    // max 100 requests per minute

function simpleRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || 'unknown-ip';
  const now = Date.now();

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  record.count++;
  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Çok fazla istek gönderildi. Lütfen bir dakika sonra tekrar deneyin.',
    });
  }

  next();
}

app.use(simpleRateLimiter);

// API routes
app.use('/api/places', placesRouter);
app.use('/api/businesses', businessesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/excluded-brands', excludedBrandsRouter);
app.use('/api/sessions', sessionsRouter);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`);
});
