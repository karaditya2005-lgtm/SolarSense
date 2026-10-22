import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { corsOptions } from './config/cors.js';
import { requestId } from './middleware/requestId.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

export const createApp = () => {
  const app = express();

  // Trust proxy for reverse proxies (Render, Vercel, Railway, Nginx)
  app.set('trust proxy', 1);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // frontend serves separate CSP
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS
  app.use(cors(corsOptions));

  // Gzip compression
  app.use(compression());

  // Body parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Cookie parser
  app.use(cookieParser());

  // Request correlation ID
  app.use(requestId);

  // Structured HTTP logging (skip during testing to keep test output clean)
  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        genReqId: (req) => req.id,
        autoLogging: {
          ignore: (req) => req.url === '/api/health',
        },
      })
    );
  }

  // Global rate limiter
  app.use('/api', globalLimiter);

  // API router
  app.use('/api', apiRouter);

  // 404 handler
  app.use(notFound);

  // Global error handler
  app.use(errorHandler);

  return app;
};
