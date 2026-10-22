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
  console.log('   SOLARSENSE WEATHER & SOLAR DATA BACKEND REAL TEST SUITE');
  console.log('===============================================================\n');

  // Direct Atlas connection for checking persistence
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || 'solarsense',
  });
  console.log('Connected to MongoDB Atlas for persistence verification.\n');

  // 1. Backend Server & MongoDB Atlas Connection
  console.log('[1] Testing Backend Health & MongoDB Atlas Connection...');
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const json = await res.json();
    console.log(`Status: ${res.status}`, JSON.stringify(json));
    if (res.status === 200 && json.success === true && json.data?.db === 'ok') {
      results['Backend server running'] = 'PASS';
      results['MongoDB Atlas connection'] = 'PASS';
      results['GET /api/health'] = 'PASS';
    } else {
      results['Backend server running'] = res.status === 200 ? 'PASS' : 'FAIL';
      results['MongoDB Atlas connection'] = 'FAIL';
      results['GET /api/health'] = 'FAIL';
    }
  } catch (err) {
    console.error('Health test error:', err.message);
    results['Backend server running'] = 'FAIL';
    results['MongoDB Atlas connection'] = 'FAIL';
  }

  // 2. Authentication Protection Checks
  console.log('\n[2] Testing Authentication Protection on Weather & Solar Endpoints...');
  try {
    const res1 = await fetch(`${BASE_URL}/weather/current?latitude=28.61&longitude=77.20`);
    const json1 = await res1.json();
    console.log('Unauth /api/weather/current Status:', res1.status, json1.error?.code);

    const res2 = await fetch(`${BASE_URL}/solar-data`);
    const json2 = await res2.json();
    console.log('Unauth /api/solar-data Status:', res2.status, json2.error?.code);

    if (res1.status === 401 && res2.status === 401 && json1.error?.code === 'TOKEN_INVALID') {
      results['Authentication protection'] = 'PASS';
    } else {
      results['Authentication protection'] = 'FAIL';
    }
  } catch (err) {
    console.error('Auth protection error:', err.message);
    results['Authentication protection'] = 'FAIL';
  }

  // 3. Authenticate User to obtain Bearer Token
  console.log('\n[3] Authenticating as test user...');
  let token = null;
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'engineer@solarsense.internal',
        password: 'SolarPassword123!',
      }),
    });
    const json = await res.json();
    token = json.data?.accessToken;
    console.log('Authenticated successfully, Token received:', !!token);
  } catch (err) {
    console.error('Login error:', err.message);
  }

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 4. Weather with Valid Coordinates: GET /api/weather/current
  console.log('\n[4] Testing GET /api/weather/current with valid coordinates (28.6139, 77.2090)...');
  try {
    const res = await fetch(`${BASE_URL}/weather/current?latitude=28.6139&longitude=77.2090`, {
      headers: authHeaders,
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Current conditions:', JSON.stringify(json.data?.current));
    console.log('Source:', json.data?.source);

    const cur = json.data?.current;
    if (
      res.status === 200 &&
      json.success === true &&
      typeof cur?.temperatureC === 'number' &&
      typeof cur?.humidityPct === 'number' &&
      typeof cur?.windSpeedMs === 'number' &&
      typeof cur?.ghiWm2 === 'number'
    ) {
      results['GET /api/weather/current (valid location)'] = 'PASS';
    } else {
      results['GET /api/weather/current (valid location)'] = 'FAIL';
    }
  } catch (err) {
    console.error('Current weather error:', err.message);
    results['GET /api/weather/current (valid location)'] = 'FAIL';
  }

  // 5. General Weather Endpoint: GET /api/weather
  console.log('\n[5] Testing GET /api/weather with coordinates...');
  try {
    const res = await fetch(`${BASE_URL}/weather?latitude=28.6139&longitude=77.2090`, {
      headers: authHeaders,
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Hourly records count:', json.data?.hourly?.length);

    if (res.status === 200 && json.success === true && json.data?.hourly?.length === 24) {
      results['GET /api/weather (general endpoint)'] = 'PASS';
    } else {
      results['GET /api/weather (general endpoint)'] = 'FAIL';
    }
  } catch (err) {
    console.error('General weather error:', err.message);
    results['GET /api/weather (general endpoint)'] = 'FAIL';
  }

  // 6. Hourly Weather Forecast: GET /api/weather/forecast
  console.log('\n[6] Testing GET /api/weather/forecast with specific date...');
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const res = await fetch(`${BASE_URL}/weather/forecast?latitude=28.6139&longitude=77.2090&date=${todayStr}`, {
      headers: authHeaders,
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Forecast timezone:', json.data?.timezone, 'Hourly count:', json.data?.hourly?.length);

    if (res.status === 200 && json.success === true && json.data?.hourly?.length === 24) {
      results['GET /api/weather/forecast (hourly forecast)'] = 'PASS';
    } else {
      results['GET /api/weather/forecast (hourly forecast)'] = 'FAIL';
    }
  } catch (err) {
    console.error('Forecast weather error:', err.message);
    results['GET /api/weather/forecast (hourly forecast)'] = 'FAIL';
  }

  // 7. Geocoding Resolution: GET /api/weather/geocode?q=Paris
  console.log('\n[7] Testing GET /api/weather/geocode?q=Paris...');
  try {
    const res = await fetch(`${BASE_URL}/weather/geocode?q=Paris`, {
      headers: authHeaders,
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('First result:', json.data?.results?.[0]?.name, json.data?.results?.[0]?.country, 'Coords:', json.data?.results?.[0]?.latitude, json.data?.results?.[0]?.longitude);

    if (res.status === 200 && json.success === true && json.data?.results?.length > 0) {
      results['GET /api/weather/geocode (location resolution)'] = 'PASS';
    } else {
      results['GET /api/weather/geocode (location resolution)'] = 'FAIL';
    }
  } catch (err) {
    console.error('Geocode error:', err.message);
    results['GET /api/weather/geocode (location resolution)'] = 'FAIL';
  }

  // 8. Error Handling: Invalid Coordinates (-999, 999)
  console.log('\n[8] Testing Invalid Coordinates Handling (latitude 195)...');
  try {
    const res = await fetch(`${BASE_URL}/weather/current?latitude=195&longitude=77.20`, {
      headers: authHeaders,
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`, JSON.stringify(json.error));

    if (res.status === 422 && json.success === false && json.error?.code === 'VALIDATION_ERROR') {
      results['Invalid coordinates handling'] = 'PASS';
    } else {
      results['Invalid coordinates handling'] = 'FAIL';
    }
  } catch (err) {
    console.error('Invalid coordinates error:', err.message);
    results['Invalid coordinates handling'] = 'FAIL';
  }

  // 9. Error Handling: Missing Parameters
  console.log('\n[9] Testing Missing Parameters Handling...');
  try {
    const res = await fetch(`${BASE_URL}/weather/current`, {
      headers: authHeaders,
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`, JSON.stringify(json.error));

    if (res.status === 422 && json.success === false && json.error?.code === 'VALIDATION_ERROR') {
      results['Missing parameters handling'] = 'PASS';
    } else {
      results['Missing parameters handling'] = 'FAIL';
    }
  } catch (err) {
    console.error('Missing parameters error:', err.message);
    results['Missing parameters handling'] = 'FAIL';
  }

  // 10. Solar Data Endpoints: GET /api/solar-data & GET /api/weather/solar-data
  console.log('\n[10] Testing GET /api/solar-data & GET /api/weather/solar-data...');
  try {
    const res1 = await fetch(`${BASE_URL}/solar-data?limit=5`, {
      headers: authHeaders,
    });
    const json1 = await res1.json();
    console.log('/api/solar-data Status:', res1.status, 'Total records:', json1.meta?.total, 'Returned:', json1.data?.records?.length);

    const res2 = await fetch(`${BASE_URL}/weather/solar-data?limit=5`, {
      headers: authHeaders,
    });
    const json2 = await res2.json();
    console.log('/api/weather/solar-data Status:', res2.status, 'Returned:', json2.data?.records?.length);

    if (
      res1.status === 200 &&
      res2.status === 200 &&
      json1.success === true &&
      json1.data?.records?.length > 0 &&
      json1.data?.records?.[0]?.ghiWm2 !== undefined
    ) {
      results['Solar data endpoints (GET /api/solar-data)'] = 'PASS';
    } else {
      results['Solar data endpoints (GET /api/solar-data)'] = 'FAIL';
    }
  } catch (err) {
    console.error('Solar data error:', err.message);
    results['Solar data endpoints (GET /api/solar-data)'] = 'FAIL';
  }

  // 11. MongoDB Weather Cache Persistence & Reuse
  console.log('\n[11] Testing MongoDB Weather Cache Persistence & Subsequent Reuse...');
  try {
    const cachedDoc = await mongoose.connection.collection('weatherdatas').findOne({
      key: { $regex: '^28.61:77.2' },
    });
    console.log('MongoDB WeatherData cached record found:', !!cachedDoc, 'Key:', cachedDoc?.key, 'Provider:', cachedDoc?.provider);

    // Call API again and verify source indicates cache
    const secondCall = await fetch(`${BASE_URL}/weather/current?latitude=28.6139&longitude=77.2090`, {
      headers: authHeaders,
    });
    const secondJson = await secondCall.json();
    console.log('Second API call source:', secondJson.data?.source);

    if (cachedDoc && secondJson.data?.source === 'cache:open-meteo') {
      results['MongoDB weather caching & reuse'] = 'PASS';
    } else {
      results['MongoDB weather caching & reuse'] = 'FAIL';
    }
  } catch (err) {
    console.error('Cache verification error:', err.message);
    results['MongoDB weather caching & reuse'] = 'FAIL';
  }

  await mongoose.disconnect();
  console.log('\nMongoDB Atlas test connection closed.');

  console.log('\n===============================================================');
  console.log('                 FINAL TEST RESULTS SUMMARY');
  console.log('===============================================================');
  console.log(JSON.stringify(results, null, 2));
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
