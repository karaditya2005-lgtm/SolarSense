import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './setup.js';

describe('Public & Health API (/api)', () => {
  it('GET /api/health returns 200 with api and db status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.api).toBe('ok');
    expect(res.body.data.db).toBe('ok');
    expect(res.body.data.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/public/stats returns aggregate platform counts', async () => {
    const res = await request(app).get('/api/public/stats');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.totalForecasts).toBe('number');
    expect(typeof res.body.data.totalUsers).toBe('number');
  });

  it('POST /api/contact persists inquiry in database', async () => {
    const res = await request(app).post('/api/contact').send({
      name: 'Curious Visitor',
      email: 'visitor@example.com',
      subject: 'Inquiry about solar forecasting',
      message: 'Hello, I would like to know how the ML model estimates solar radiation.',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
  });
});
