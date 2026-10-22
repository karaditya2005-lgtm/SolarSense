import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './setup.js';
import { User } from '../src/models/User.js';
import { generateAccessToken } from '../src/services/auth.service.js';

describe('Solar Data Benchmark & CSV Management (/api/admin/solar-data)', () => {
  let adminUser;
  let adminToken;

  beforeEach(async () => {
    adminUser = await User.create({
      name: 'Admin Alice',
      email: 'alice@solarsense.internal',
      passwordHash: 'dummyhash',
      role: 'admin',
      status: 'active',
    });
    adminToken = generateAccessToken(adminUser);
  });

  it('allows administrator to create a benchmark solar record', async () => {
    const recordPayload = {
      location: {
        name: 'Delhi Benchmark Array',
        latitude: 28.61,
        longitude: 77.21,
        timezone: 'Asia/Kolkata',
      },
      timestamp: '2024-06-21T07:00:00Z',
      ghiWm2: 850.0,
      dniWm2: 700.0,
      dhiWm2: 150.0,
      temperatureC: 36.5,
      cloudCoverPct: 10.0,
      humidityPct: 40.0,
      windSpeedMs: 3.2,
      acPowerKw: 42.5,
      capacityKw: 50.0,
      source: 'nrel_pvwatts_benchmark',
    };

    const res = await request(app)
      .post('/api/admin/solar-data')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(recordPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.record.ghiWm2).toBe(850.0);
    expect(res.body.data.record.location.name).toBe('Delhi Benchmark Array');
  });

  it('rejects duplicate record for same coordinates, timestamp, and source (409 Conflict)', async () => {
    const recordPayload = {
      location: {
        name: 'Delhi Benchmark Array',
        latitude: 28.61,
        longitude: 77.21,
        timezone: 'Asia/Kolkata',
      },
      timestamp: '2024-06-21T07:00:00Z',
      ghiWm2: 850.0,
      temperatureC: 36.5,
      source: 'nrel_pvwatts_benchmark',
    };

    await request(app)
      .post('/api/admin/solar-data')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(recordPayload);

    const dupRes = await request(app)
      .post('/api/admin/solar-data')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(recordPayload);

    expect(dupRes.status).toBe(409);
  });

  it('imports valid CSV records and reports row-level errors for invalid rows', async () => {
    const csvContent = `locationName,latitude,longitude,timezone,timestamp,ghiWm2,temperatureC,source
Valid Site,28.61,77.21,UTC,2024-06-21T08:00:00Z,900.0,38.0,csv_test
Invalid GHI,28.61,77.21,UTC,2024-06-21T09:00:00Z,99999.0,38.0,csv_test
Invalid Lat,999.0,77.21,UTC,2024-06-21T10:00:00Z,500.0,30.0,csv_test`;

    const res = await request(app)
      .post('/api/admin/solar-data/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from(csvContent), 'solar_data.csv');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.inserted).toBe(1);
    expect(res.body.data.errors.length).toBe(2);
    expect(res.body.data.errors[0].row).toBe(3);
    expect(res.body.data.errors[1].row).toBe(4);
  });
});
