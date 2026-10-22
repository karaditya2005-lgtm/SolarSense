import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Forecast } from '../src/models/Forecast.js';
import { SolarData } from '../src/models/SolarData.js';
import { WeatherData } from '../src/models/WeatherData.js';
import { SystemLog } from '../src/models/SystemLog.js';
import { ContactMessage } from '../src/models/ContactMessage.js';
import { Setting } from '../src/models/Setting.js';
import { ModelVersion } from '../src/models/ModelVersion.js';
import { logger } from '../src/config/logger.js';

const run = async () => {
  try {
    await connectDB();

    logger.info('Syncing indexes for all Mongoose models...');
    await Promise.all([
      User.syncIndexes(),
      Forecast.syncIndexes(),
      SolarData.syncIndexes(),
      WeatherData.syncIndexes(),
      SystemLog.syncIndexes(),
      ContactMessage.syncIndexes(),
      Setting.syncIndexes(),
      ModelVersion.syncIndexes(),
    ]);

    logger.info('All database indexes successfully synchronized and verified.');
  } catch (err) {
    logger.error({ err }, 'Error synchronizing database indexes.');
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

run();
