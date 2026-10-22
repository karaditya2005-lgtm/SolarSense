import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB_NAME: z.string().default('solarsense'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  COOKIE_SECURE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().optional(),
  WEATHER_API_BASE_URL: z.string().url().default('https://api.open-meteo.com/v1/forecast'),
  WEATHER_GEOCODING_BASE_URL: z.string().url().default('https://geocoding-api.open-meteo.com/v1/search'),
  WEATHER_API_KEY: z.string().optional(),
  WEATHER_TIMEOUT_MS: z.coerce.number().default(8000),
  WEATHER_CACHE_TTL_MINUTES: z.coerce.number().default(60),
  ML_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  ML_INTERNAL_KEY: z.string().min(16, 'ML_INTERNAL_KEY must be at least 16 characters'),
  ML_TIMEOUT_MS: z.coerce.number().default(10000),
  FORECAST_MAX_HORIZON_DAYS: z.coerce.number().default(7),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),
  ADMIN_SEED_NAME: z.string().default('System Administrator'),
  ADMIN_SEED_EMAIL: z.string().email().default('admin@solarsense.internal'),
  ADMIN_SEED_PASSWORD: z.string().min(8).default('Admin@SolarSense2026!'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:');
  parsed.error.errors.forEach((err) => {
    console.error(`  - ${err.path.join('.')}: ${err.message}`);
  });
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

export const env = parsed.data || {};
