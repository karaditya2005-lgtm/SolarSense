import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from './setup.js';
import { User } from '../src/models/User.js';
import { generateAccessToken } from '../src/services/auth.service.js';
import * as weatherService from '../src/services/weather.service.js';
import * as mlClientService from '../src/services/mlClient.service.js';

describe('Solar Forecast Lifecycle (/api/forecasts)', () => {
  let user1;
  let user2;
  let token1;
  let token2;

  beforeEach(async () => {
    user1 = await User.create({
      name: 'Solar Fan',
      email: 'solar1@example.com',
      passwordHash: 'dummy',
      role: 'user',
      status: 'active',
    });
    token1 = generateAccessToken(user1);

    user2 = await User.create({
      name: 'Other User',
      email: 'solar2@example.com',
      passwordHash: 'dummy',
      role: 'user',
      status: 'active',
    });
    token2 = generateAccessToken(user2);
  });

  it('rejects forecast creation with date outside horizon (422)', async () => {
    const distantFuture = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/forecasts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        locationQuery: 'Delhi, India',
        targetDateTime: distantFuture,
        systemCapacityKw: 5.0,
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('generates a forecast successfully when external services return valid data', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Mock weather service to avoid real network call in tests
    vi.spyOn(weatherService, 'geocodeLocation').mockResolvedValue([
      {
        name: 'New Delhi, India',
        latitude: 28.61,
        longitude: 77.21,
        timezone: 'Asia/Kolkata',
      },
    ]);

    vi.spyOn(weatherService, 'getHourlyWeather').mockResolvedValue({
      source: 'api:open-meteo',
      fetchedAt: new Date(),
      timezone: 'Asia/Kolkata',
      hourly: [
        {
          time: tomorrow,
          temperatureC: 32.0,
          cloudCoverPct: 15.0,
          humidityPct: 45.0,
          windSpeedMs: 3.5,
          ghiWm2: 850.0,
          dniWm2: 700.0,
          dhiWm2: 150.0,
          precipitationMm: 0.0,
        },
      ],
    });

    vi.spyOn(mlClientService, 'predictSolarPower').mockResolvedValue({
      model: { name: 'GradientBoostingSolarEstimator', version: 'v1.0.0' },
      predictions: [
        {
          timestamp: tomorrow,
          powerKw: 4.25,
          capacityFactor: 0.85,
          solarElevationDeg: 65.0,
        },
      ],
      durationMs: 12.5,
    });

    const res = await request(app)
      .post('/api/forecasts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        locationQuery: 'New Delhi, India',
        targetDateTime: tomorrow,
        systemCapacityKw: 5.0,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.forecast.prediction.targetPowerKw).toBe(4.25);
    expect(res.body.data.forecast.status).toBe('completed');
    expect(res.body.data.forecast.model.name).toBe('GradientBoostingSolarEstimator');
  });

  it('prevents user from reading another users forecast (404 Not Found to prevent ID probing)', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    vi.spyOn(weatherService, 'geocodeLocation').mockResolvedValue([
      { name: 'Delhi', latitude: 28.61, longitude: 77.21, timezone: 'UTC' },
    ]);
    vi.spyOn(weatherService, 'getHourlyWeather').mockResolvedValue({
      source: 'api:open-meteo',
      hourly: [{ time: tomorrow, temperatureC: 25, cloudCoverPct: 0, humidityPct: 50, windSpeedMs: 2, ghiWm2: 500 }],
    });
    vi.spyOn(mlClientService, 'predictSolarPower').mockResolvedValue({
      model: { name: 'TestModel', version: 'v1.0.0' },
      predictions: [{ timestamp: tomorrow, powerKw: 3.0, capacityFactor: 0.6, solarElevationDeg: 50 }],
    });

    const createRes = await request(app)
      .post('/api/forecasts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        locationQuery: 'Delhi',
        targetDateTime: tomorrow,
        systemCapacityKw: 5.0,
      });

    const forecastId = createRes.body.data.forecast._id;

    // User 2 tries to read User 1's forecast
    const readRes = await request(app)
      .get(`/api/forecasts/${forecastId}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(readRes.status).toBe(404);
  });
});
