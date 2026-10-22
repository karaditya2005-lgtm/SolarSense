import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { sendError } from '../utils/response.js';

const rateLimitHandler = (req, res) => {
  return sendError(
    res,
    {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
      details: [],
    },
    429,
    req.id
  );
};

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? (env.RATE_LIMIT_MAX || 300) : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) =>
    req.path === '/health' ||
    env.NODE_ENV === 'test' ||
    (env.NODE_ENV === 'development' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 15 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) =>
    env.NODE_ENV === 'test' ||
    (env.NODE_ENV === 'development' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')),
});

export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 messages per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: () => env.NODE_ENV === 'test',
});

export const forecastLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 forecasts per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: () => env.NODE_ENV === 'test',
});
