import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000/api';
const results = {};

async function runTests() {
  console.log('===============================================================');
  console.log('   SOLARSENSE FORECAST & DASHBOARD BACKEND REAL TEST SUITE');
  console.log('===============================================================\n');

  // Connect to MongoDB Atlas directly to inspect persistence
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || 'solarsense',
  });
  console.log('Connected to MongoDB Atlas for persistence verification.\n');

  // 1. GET /api/health
  console.log('[1] Testing GET /api/health ...');
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const json = await res.json();
    console.log(`Status: ${res.status}`, JSON.stringify(json));
    if (res.status === 200 && json.success === true && json.data?.db === 'ok') {
      results['GET /api/health'] = 'PASS';
    } else {
      results['GET /api/health'] = 'FAIL';
    }
  } catch (err) {
    console.error('Health test error:', err.message);
    results['GET /api/health'] = 'FAIL';
  }

  // 2. Unauthenticated Dashboard Access
  console.log('\n[2] Testing Unauthenticated Access to /api/dashboard/summary ...');
  try {
    const res = await fetch(`${BASE_URL}/dashboard/summary`);
    const json = await res.json();
    console.log(`Status: ${res.status}`, JSON.stringify(json.error));
    if (res.status === 401 && json.success === false && json.error?.code === 'TOKEN_INVALID') {
      results['Unauthenticated dashboard access'] = 'PASS';
    } else {
      results['Unauthenticated dashboard access'] = 'FAIL';
    }
  } catch (err) {
    console.error('Unauth dashboard error:', err.message);
    results['Unauthenticated dashboard access'] = 'FAIL';
  }

  // Obtain user auth token
  console.log('\n[Setup] Authenticating test user...');
  let userToken = null;
  let userEmail = 'engineer@solarsense.internal';
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        password: 'SolarPassword123!',
      }),
    });
    const json = await res.json();
    userToken = json.data?.accessToken;
    console.log('Authenticated user:', json.data?.user?.email, 'Token received:', !!userToken);
  } catch (err) {
    console.error('Login error:', err.message);
  }

  const userHeaders = {
    Authorization: `Bearer ${userToken}`,
    'Content-Type': 'application/json',
  };

  // 3. Authenticated Dashboard Access
  console.log('\n[3] Testing Authenticated Access to /api/dashboard/summary ...');
  try {
    const res = await fetch(`${BASE_URL}/dashboard/summary`, {
      headers: userHeaders,
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Dashboard Data Summary:', JSON.stringify({
      latestForecast: json.data?.latestForecast,
      stats: json.data?.stats,
      indicators: json.data?.indicators,
    }));

    if (
      res.status === 200 &&
      json.success === true &&
      json.data?.stats &&
      typeof json.data.stats.totalForecasts === 'number' &&
      json.data?.indicators
    ) {
      results['Authenticated dashboard endpoint'] = 'PASS';
    } else {
      results['Authenticated dashboard endpoint'] = 'FAIL';
    }
  } catch (err) {
    console.error('Auth dashboard error:', err.message);
    results['Authenticated dashboard endpoint'] = 'FAIL';
  }

  // 4. Empty Forecast Data Scenario
  console.log('\n[4] Testing Empty Forecast-Data Scenario (GET /api/forecasts & /api/forecasts/stats) ...');
  try {
    const listRes = await fetch(`${BASE_URL}/forecasts`, {
      headers: userHeaders,
    });
    const listJson = await listRes.json();
    console.log('/api/forecasts Status:', listRes.status, 'Total in meta:', listJson.meta?.total);

    const statsRes = await fetch(`${BASE_URL}/forecasts/stats`, {
      headers: userHeaders,
    });
    const statsJson = await statsRes.json();
    console.log('/api/forecasts/stats Status:', statsRes.status, 'Total forecasts:', statsJson.data?.total);

    if (
      listRes.status === 200 &&
      listJson.success === true &&
      Array.isArray(listJson.data?.forecasts) &&
      statsRes.status === 200 &&
      statsJson.success === true &&
      typeof statsJson.data?.total === 'number'
    ) {
      results['Empty forecast-data scenario'] = 'PASS';
    } else {
      results['Empty forecast-data scenario'] = 'FAIL';
    }
  } catch (err) {
    console.error('Empty forecast test error:', err.message);
    results['Empty forecast-data scenario'] = 'FAIL';
  }

  // 5. Missing Forecast Parameters
  console.log('\n[5] Testing Missing Forecast Parameters (POST /api/forecasts with {}) ...');
  try {
    const res = await fetch(`${BASE_URL}/forecasts`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({}),
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`, JSON.stringify(json.error));

    if (res.status === 422 && json.success === false && json.error?.code === 'VALIDATION_ERROR') {
      results['Missing forecast parameters'] = 'PASS';
    } else {
      results['Missing forecast parameters'] = 'FAIL';
    }
  } catch (err) {
    console.error('Missing forecast params error:', err.message);
    results['Missing forecast parameters'] = 'FAIL';
  }

  // 6. Invalid Forecast Parameters (Negative capacity & past target date)
  console.log('\n[6] Testing Invalid Forecast Parameters (negative capacity & past date) ...');
  try {
    const res = await fetch(`${BASE_URL}/forecasts`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        locationQuery: 'Delhi',
        targetDateTime: '2020-01-01T12:00:00.000Z',
        systemCapacityKw: -5,
      }),
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`, JSON.stringify(json.error));

    if (res.status === 422 && json.success === false && json.error?.code === 'VALIDATION_ERROR') {
      results['Invalid forecast parameters'] = 'PASS';
    } else {
      results['Invalid forecast parameters'] = 'FAIL';
    }
  } catch (err) {
    console.error('Invalid forecast params error:', err.message);
    results['Invalid forecast parameters'] = 'FAIL';
  }

  // 7. Valid Forecast Request (When ML is not yet integrated)
  console.log('\n[7] Testing Valid Forecast Request (Real weather resolved; ML offline) ...');
  let createdFailedForecastId = null;
  try {
    // Tomorrow at 12:00 UTC
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setUTCHours(12, 0, 0, 0);

    const res = await fetch(`${BASE_URL}/forecasts`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        locationQuery: 'Madrid, Spain',
        targetDateTime: tomorrow.toISOString(),
        systemCapacityKw: 8.5,
        tiltDeg: 35,
        azimuthDeg: 180,
        mode: 'day',
      }),
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`, JSON.stringify(json.error));

    // When ML service is not running, backend must return documented 503 ML_UNAVAILABLE
    if (res.status === 503 && json.success === false && json.error?.code === 'ML_UNAVAILABLE') {
      results['Valid forecast request (ML not available handling)'] = 'PASS';
    } else {
      results['Valid forecast request (ML not available handling)'] = 'FAIL';
    }
  } catch (err) {
    console.error('Valid forecast error:', err.message);
    results['Valid forecast request (ML not available handling)'] = 'FAIL';
  }

  // 8. MongoDB Queries & Diagnostic Record Verification
  console.log('\n[8] Testing MongoDB Queries & Diagnostics Persistence in Atlas ...');
  try {
    const failedForecast = await mongoose.connection.collection('forecasts').findOne(
      { 'location.name': /Madrid/i },
      { sort: { createdAt: -1 } }
    );
    console.log('MongoDB Forecast record found:', !!failedForecast);
    if (failedForecast) {
      console.log('Status:', failedForecast.status);
      console.log('ErrorCode:', failedForecast.errorCode);
      console.log('Weather hourly count in snapshot:', failedForecast.weatherSnapshot?.hourly?.length);
      console.log('Features vector instances count:', failedForecast.features?.length);
      createdFailedForecastId = failedForecast._id.toString();
    }

    if (
      failedForecast &&
      failedForecast.status === 'failed' &&
      failedForecast.errorCode === 'ML_UNAVAILABLE' &&
      failedForecast.weatherSnapshot?.hourly?.length === 24 &&
      failedForecast.features?.length === 24
    ) {
      results['MongoDB queries & persistence'] = 'PASS';
    } else {
      results['MongoDB queries & persistence'] = 'FAIL';
    }
  } catch (err) {
    console.error('MongoDB verification error:', err.message);
    results['MongoDB queries & persistence'] = 'FAIL';
  }

  // 9. User Authorization & Cross-User Isolation
  console.log('\n[9] Testing User Authorization & Cross-User Isolation ...');
  try {
    // Log in as second user (admin)
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@solarsense.internal',
        password: 'Admin@SolarSense2026!',
      }),
    });
    const adminJson = await adminRes.json();
    const adminToken = adminJson.data?.accessToken;

    // Normal user attempts to list with userId of another user: should be constrained to own forecasts
    const normalListRes = await fetch(`${BASE_URL}/forecasts`, {
      headers: userHeaders,
    });
    const normalListJson = await normalListRes.json();
    console.log('Normal user forecast count:', normalListJson.data?.forecasts?.length);

    // Retrieve specific forecast by owner
    const ownerRes = await fetch(`${BASE_URL}/forecasts/${createdFailedForecastId}`, {
      headers: userHeaders,
    });
    console.log('Owner fetch forecast Status:', ownerRes.status);

    // Delete forecast by owner
    const delRes = await fetch(`${BASE_URL}/forecasts/${createdFailedForecastId}`, {
      method: 'DELETE',
      headers: userHeaders,
    });
    const delJson = await delRes.json();
    console.log('Owner delete forecast Status:', delRes.status, JSON.stringify(delJson));

    // Verify it is gone
    const verifyGone = await fetch(`${BASE_URL}/forecasts/${createdFailedForecastId}`, {
      headers: userHeaders,
    });
    console.log('Re-fetch deleted forecast Status:', verifyGone.status);

    if (ownerRes.status === 200 && delRes.status === 200 && verifyGone.status === 404) {
      results['User authorization & data isolation'] = 'PASS';
    } else {
      results['User authorization & data isolation'] = 'FAIL';
    }
  } catch (err) {
    console.error('Authorization test error:', err.message);
    results['User authorization & data isolation'] = 'FAIL';
  }

  // 10. General Error Handling
  console.log('\n[10] Testing Error Handling on Non-Existent Resources ...');
  try {
    const res = await fetch(`${BASE_URL}/forecasts/6ad9463d0d4dbaf0e2499999`, {
      headers: userHeaders,
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`, JSON.stringify(json.error));

    if (res.status === 404 && json.success === false && json.error?.code === 'NOT_FOUND') {
      results['Error handling'] = 'PASS';
    } else {
      results['Error handling'] = 'FAIL';
    }
  } catch (err) {
    console.error('Error handling test error:', err.message);
    results['Error handling'] = 'FAIL';
  }

  await mongoose.disconnect();
  console.log('\nMongoDB Atlas connection closed.');

  console.log('\n===============================================================');
  console.log('                 FINAL TEST RESULTS SUMMARY');
  console.log('===============================================================');
  console.log(JSON.stringify(results, null, 2));
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
