import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './setup.js';
import { User } from '../src/models/User.js';

describe('Authentication Flow (/api/auth)', () => {
  const validUser = {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    password: 'SecurePassword123!',
  };

  it('registers a new user successfully and hashes the password', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.role).toBe('user');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();

    // Verify stored hash ≠ plain password
    const stored = await User.findOne({ email: validUser.email }).select('+passwordHash');
    expect(stored).toBeDefined();
    expect(stored.passwordHash).not.toBe(validUser.password);
  });

  it('rejects registration with duplicate email (409 Conflict)', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects weak password with validation error (422)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Weak Pass',
      email: 'weak@example.com',
      password: 'weak',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('logs in successfully and returns JWT access token and refresh cookie', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: validUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);

    // Verify Set-Cookie header for refreshToken
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.includes('refreshToken='))).toBe(true);
    expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
  });

  it('returns identical 401 for wrong password and unknown email (timing attack defense)', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    // Wrong password
    const resWrongPass = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: 'WrongPassword123!',
    });

    // Unknown email
    const resUnknown = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'WrongPassword123!',
    });

    expect(resWrongPass.status).toBe(401);
    expect(resUnknown.status).toBe(401);
    expect(resWrongPass.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(resUnknown.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(resWrongPass.body.error.message).toBe(resUnknown.body.error.message);
  });

  it('blocks suspended users from logging in (403 Forbidden)', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    await User.updateOne({ email: validUser.email }, { status: 'suspended' });

    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: validUser.password,
    });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
  });

  it('rotates refresh token and returns new access token', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const loginRes = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: validUser.password,
    });

    const cookieHeader = loginRes.headers['set-cookie'];
    const refreshCookie = cookieHeader.find((c) => c.startsWith('refreshToken='));

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [refreshCookie]);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();

    // Verify a new cookie was set (rotation)
    const newCookies = refreshRes.headers['set-cookie'];
    expect(newCookies).toBeDefined();
  });
});
