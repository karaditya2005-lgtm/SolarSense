import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { seedDefaultSettings } from './services/settings.service.js';
import { ensureDesignatedAdmin } from './services/admin.service.js';

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Ensure initial settings exist
    await seedDefaultSettings();

    // 3. Ensure designated administrator exists
    await ensureDesignatedAdmin();

    // 3. Create app and listen
    const app = createApp();
    const server = app.listen(env.PORT, () => {
      logger.info(
        { port: env.PORT, env: env.NODE_ENV },
        `⚡ SolarSense API Server running at http://localhost:${env.PORT}`
      );
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      logger.info({ signal }, 'Received shutdown signal. Closing HTTP server and DB connections...');
      server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDB();
        process.exit(0);
      });

      // Force shutdown after 10 seconds if hanging
      setTimeout(() => {
        logger.fatal('Forced shutdown due to timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.fatal({ err }, 'Failed to bootstrap SolarSense server.');
    process.exit(1);
  }
};

startServer();
