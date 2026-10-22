import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDefaultSettings } from '../src/services/settings.service.js';
import { logger } from '../src/config/logger.js';

const run = async () => {
  try {
    await connectDB();
    await seedDefaultSettings();
    logger.info('Default application settings seeded successfully.');
  } catch (err) {
    logger.error({ err }, 'Error seeding default settings.');
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

run();
