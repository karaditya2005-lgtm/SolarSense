import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

let isConnected = false;

export const connectDB = async (retries = 5, delayMs = 3000) => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.connection.on('connected', () => {
    isConnected = true;
    logger.info('MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('MongoDB disconnected');
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info({ attempt, retries }, 'Attempting MongoDB connection...');
      await mongoose.connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DB_NAME,
        serverSelectionTimeoutMS: 5000,
        autoIndex: env.NODE_ENV !== 'production',
      });
      return mongoose.connection;
    } catch (error) {
      logger.error({ attempt, retries, error: error.message }, 'Failed to connect to MongoDB');
      if (attempt === retries) {
        if (env.NODE_ENV === 'test') {
          throw error;
        }
        logger.fatal('Could not connect to MongoDB after maximum retries. Exiting.');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected cleanly');
  }
};
