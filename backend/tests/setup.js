import { beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { seedDefaultSettings } from '../src/services/settings.service.js';

let mongoServer;
let app;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-32-chars-long!';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-32-chars-long!';
  process.env.ML_INTERNAL_KEY = 'test-internal-key-32-chars-long!';

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
  await seedDefaultSettings();
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // Clear collections except settings
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    if (key !== 'settings') {
      await collections[key].deleteMany({});
    }
  }
});

export { app, mongoose };
