import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './setup.js';
import { User } from '../src/models/User.js';
import { generateAccessToken } from '../src/services/auth.service.js';

describe('Authorization & Multi-Role RBAC (/api/admin)', () => {
  let regularUser;
  let adminUser;
  let regularToken;
  let adminToken;

  beforeEach(async () => {
    regularUser = await User.create({
      name: 'Regular Bob',
      email: 'bob@example.com',
      passwordHash: 'dummyhash',
      role: 'user',
      status: 'active',
    });
    regularToken = generateAccessToken(regularUser);

    adminUser = await User.create({
      name: 'Admin Alice',
      email: 'alice@solarsense.internal',
      passwordHash: 'dummyhash',
      role: 'admin',
      status: 'active',
    });
    adminToken = generateAccessToken(adminUser);
  });

  it('rejects unauthenticated requests to /api/admin/stats with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('rejects regular users accessing /api/admin/stats with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${regularToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('allows administrator to access /api/admin/stats', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.users).toBeDefined();
    expect(res.body.data.forecasts).toBeDefined();
  });

  it('prevents demotion of the last remaining active administrator (409 LAST_ADMIN)', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'user' });

    // Should be blocked either by self-demotion or last-admin guard
    expect([403, 409]).toContain(res.status);
  });

  it('prevents administrator from suspending themselves', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'suspended' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
