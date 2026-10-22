import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/config/logger.js';

const run = async () => {
  try {
    await connectDB();

    const email = (env.ADMIN_SEED_EMAIL || 'admin@solarsense.internal').toLowerCase().trim();
    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        existing.status = 'active';
        await existing.save();
        logger.info(`Promoted existing user ${email} to admin role.`);
      } else {
        logger.info(`Administrator account for ${email} already exists.`);
      }
      return;
    }

    const saltRounds = env.BCRYPT_SALT_ROUNDS || 12;
    const password = env.ADMIN_SEED_PASSWORD || 'Admin@SolarSense2026!';
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const admin = await User.create({
      name: env.ADMIN_SEED_NAME || 'System Administrator',
      email,
      passwordHash,
      role: 'admin',
      status: 'active',
      preferences: {
        units: 'metric',
        defaultCapacityKw: 10.0,
      },
    });

    logger.info(`Successfully created seed administrator: ${admin.email}`);
  } catch (err) {
    logger.error({ err }, 'Error running seed admin script.');
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

run();
