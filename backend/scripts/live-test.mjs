import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'test@solarsense.com';
const TEST_NAME = 'Test User';
const TEST_PASSWORD = 'TestPassword123';

const results = {};

async function runAllTests() {
  console.log('====================================================');
  console.log('   SOLARSENSE BACKEND LIVE ENDPOINT TEST SUITE');
  console.log('====================================================\n');

  // Connect to DB directly for pre-clean and post-clean
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || 'solarsense',
  });
  console.log('Connected to MongoDB Atlas for test lifecycle management.');

  // Ensure clean state before testing
  await mongoose.connection.collection('users').deleteOne({ email: TEST_EMAIL });

  // 1. GET /api/health
  console.log('\n[1] Testing GET /api/health ...');
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const json = await res.json();
    console.log(`Status: ${res.status}`, JSON.stringify(json));
    if (res.status === 200 && json.success === true && json.data?.db === 'ok') {
      results['Backend server'] = 'PASS';
      results['MongoDB Atlas connection'] = 'PASS';
      results['GET /api/health'] = 'PASS';
    } else {
      results['GET /api/health'] = 'FAIL';
      results['Backend server'] = res.status === 200 ? 'PASS' : 'FAIL';
      results['MongoDB Atlas connection'] = json.data?.db === 'ok' ? 'PASS' : 'FAIL';
    }
  } catch (err) {
    console.error('Health test error:', err.message);
    results['Backend server'] = 'FAIL';
    results['MongoDB Atlas connection'] = 'FAIL';
    results['GET /api/health'] = 'FAIL';
  }

  // 2. POST /api/auth/register
  console.log('\n[2] Testing POST /api/auth/register ...');
  let registeredUser = null;
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`, JSON.stringify(json));
    if (res.status === 201 && json.success === true && json.data?.user?.email === TEST_EMAIL) {
      registeredUser = json.data.user;
      results['POST /api/auth/register'] = 'PASS';
    } else {
      results['POST /api/auth/register'] = 'FAIL';
    }
  } catch (err) {
    console.error('Register test error:', err.message);
    results['POST /api/auth/register'] = 'FAIL';
  }

  // 3. Test Duplicate Registration
  console.log('\n[3] Testing Duplicate Registration ...');
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`, JSON.stringify(json));
    if (res.status === 409 && json.success === false && json.error?.code === 'EMAIL_TAKEN') {
      results['Duplicate registration'] = 'PASS';
    } else {
      results['Duplicate registration'] = 'FAIL';
    }
  } catch (err) {
    console.error('Duplicate register test error:', err.message);
    results['Duplicate registration'] = 'FAIL';
  }

  // 4. Test Invalid Login Credentials
  console.log('\n[4] Testing Invalid Login Credentials ...');
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: 'IncorrectPassword999!',
      }),
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`, JSON.stringify(json));
    if (res.status === 401 && json.success === false && json.error?.code === 'INVALID_CREDENTIALS') {
      results['Invalid login'] = 'PASS';
    } else {
      results['Invalid login'] = 'FAIL';
    }
  } catch (err) {
    console.error('Invalid login test error:', err.message);
    results['Invalid login'] = 'FAIL';
  }

  // 5. POST /api/auth/login (Valid)
  console.log('\n[5] Testing POST /api/auth/login (Valid) ...');
  let accessToken = null;
  let refreshTokenCookie = null;
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    const setCookie = res.headers.get('set-cookie');
    const json = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Set-Cookie:', setCookie);
    console.log('Response body:', JSON.stringify(json));

    accessToken = json.data?.accessToken;
    refreshTokenCookie = setCookie;

    if (res.status === 200 && json.success === true && accessToken && setCookie && setCookie.includes('refreshToken=')) {
      results['POST /api/auth/login'] = 'PASS';
    } else {
      results['POST /api/auth/login'] = 'FAIL';
    }
  } catch (err) {
    console.error('Valid login test error:', err.message);
    results['POST /api/auth/login'] = 'FAIL';
  }

  // 6. Test Unauthenticated /api/auth/me
  console.log('\n[6] Testing Unauthenticated /api/auth/me ...');
  try {
    const res = await fetch(`${BASE_URL}/auth/me`);
    const json = await res.json();
    console.log(`Status: ${res.status}`, JSON.stringify(json));
    if (res.status === 401 && json.success === false && json.error?.code === 'TOKEN_INVALID') {
      results['Unauthenticated /me'] = 'PASS';
    } else {
      results['Unauthenticated /me'] = 'FAIL';
    }
  } catch (err) {
    console.error('Unauthenticated me test error:', err.message);
    results['Unauthenticated /me'] = 'FAIL';
  }

  // 7. GET /api/auth/me (Authenticated)
  console.log('\n[7] Testing GET /api/auth/me (Authenticated) ...');
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`, JSON.stringify(json));
    if (
      res.status === 200 &&
      json.success === true &&
      json.data?.user?.email === TEST_EMAIL &&
      json.data?.user?.name === TEST_NAME &&
      !json.data?.user?.passwordHash
    ) {
      results['GET /api/auth/me'] = 'PASS';
    } else {
      results['GET /api/auth/me'] = 'FAIL';
    }
  } catch (err) {
    console.error('Authenticated me test error:', err.message);
    results['GET /api/auth/me'] = 'FAIL';
  }

  // 8. Admin Authorization
  console.log('\n[8] Testing Admin Authorization (Normal user accessing /api/admin/users) ...');
  try {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`, JSON.stringify(json));
    if (res.status === 403 && json.success === false && json.error?.code === 'FORBIDDEN') {
      results['Admin authorization'] = 'PASS';
    } else {
      results['Admin authorization'] = 'FAIL';
    }
  } catch (err) {
    console.error('Admin authorization test error:', err.message);
    results['Admin authorization'] = 'FAIL';
  }

  // 9. POST /api/auth/refresh
  console.log('\n[9] Testing POST /api/auth/refresh ...');
  let rotatedCookie = null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: refreshTokenCookie || '',
      },
    });
    const setCookie = res.headers.get('set-cookie');
    const json = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('New Set-Cookie:', setCookie);
    console.log('Response body:', JSON.stringify(json));

    rotatedCookie = setCookie || refreshTokenCookie;
    if (res.status === 200 && json.success === true && json.data?.accessToken && setCookie) {
      results['POST /api/auth/refresh'] = 'PASS';
    } else {
      results['POST /api/auth/refresh'] = 'FAIL';
    }
  } catch (err) {
    console.error('Refresh test error:', err.message);
    results['POST /api/auth/refresh'] = 'FAIL';
  }

  // 10. POST /api/auth/logout
  console.log('\n[10] Testing POST /api/auth/logout ...');
  try {
    const res = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: rotatedCookie || '',
      },
    });
    const setCookie = res.headers.get('set-cookie');
    const json = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Clear Set-Cookie:', setCookie);
    console.log('Response body:', JSON.stringify(json));

    // Verify invalidation by attempting to refresh with the logged-out cookie
    const followUpRefresh = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: rotatedCookie || '',
      },
    });
    const followUpJson = await followUpRefresh.json();
    console.log('Follow-up refresh with invalidated token Status:', followUpRefresh.status, JSON.stringify(followUpJson));

    if (
      res.status === 200 &&
      json.success === true &&
      followUpRefresh.status === 401 &&
      followUpJson.error?.code === 'TOKEN_INVALID'
    ) {
      results['POST /api/auth/logout'] = 'PASS';
    } else {
      results['POST /api/auth/logout'] = 'FAIL';
    }
  } catch (err) {
    console.error('Logout test error:', err.message);
    results['POST /api/auth/logout'] = 'FAIL';
  }

  // Clean up test user so no permanent test user is left in Atlas
  console.log('\n[Cleanup] Deleting test user from MongoDB Atlas...');
  await mongoose.connection.collection('users').deleteOne({ email: TEST_EMAIL });
  await mongoose.disconnect();
  console.log('Test user cleaned up and DB connection closed.');

  console.log('\n====================================================');
  console.log('                 FINAL RESULTS SUMMARY');
  console.log('====================================================');
  console.log(JSON.stringify(results, null, 2));
}

runAllTests().catch((err) => {
  console.error('Fatal test suite failure:', err);
  process.exit(1);
});
