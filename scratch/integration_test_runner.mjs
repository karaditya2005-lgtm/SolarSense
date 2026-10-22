const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';

const testResults = [];

function recordTest(name, passed, details) {
  testResults.push({ name, passed, details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}: ${details}`);
}

async function runTests() {
  console.log('--- STARTING SOLARSENSE FRONTEND <-> BACKEND INTEGRATION TEST SUITE ---');

  // Test 1: Frontend Server
  try {
    const res = await fetch(FRONTEND_URL);
    const html = await res.text();
    const ok = res.status === 200 && html.includes('SolarSense');
    recordTest('Frontend Server Accessibility', ok, `Status: ${res.status}, Title check: ${html.includes('SolarSense')}`);
  } catch (err) {
    recordTest('Frontend Server Accessibility', false, err.message);
  }

  // Test 2: Backend Direct Health Check
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    const json = await res.json();
    const ok = res.status === 200 && json.data.api === 'ok' && json.data.db === 'ok';
    recordTest('Backend Direct Health & DB Status', ok, `API: ${json.data?.api}, DB: ${json.data?.db}, ML: ${json.data?.ml}`);
  } catch (err) {
    recordTest('Backend Direct Health & DB Status', false, err.message);
  }

  // Test 3: Vite Proxy to Backend
  try {
    const res = await fetch(`${FRONTEND_URL}/api/health`);
    const json = await res.json();
    const ok = res.status === 200 && json.data.db === 'ok';
    recordTest('Vite Proxy /api to Backend', ok, `Proxied health check returned status ${res.status}, db: ${json.data?.db}`);
  } catch (err) {
    recordTest('Vite Proxy /api to Backend', false, err.message);
  }

  // Test 4: Real Registration in MongoDB Atlas
  const testEmail = `integration_tester_${Date.now()}@solarsense.internal`;
  const testPassword = 'SecurePassword123!';
  const testName = 'Integration Tester';
  let createdUserId = null;

  try {
    const res = await fetch(`${FRONTEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ name: testName, email: testEmail, password: testPassword }),
    });
    const json = await res.json();
    const ok = res.status === 201 && json.success === true && json.data.user.email === testEmail;
    createdUserId = json.data?.user?._id;
    recordTest('User Registration via Frontend Proxy', ok, `Status: ${res.status}, User ID: ${createdUserId}, Email: ${testEmail}`);
  } catch (err) {
    recordTest('User Registration via Frontend Proxy', false, err.message);
  }

  // Test 5: Reject Duplicate Registration
  try {
    const res = await fetch(`${FRONTEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ name: testName, email: testEmail, password: testPassword }),
    });
    const json = await res.json();
    const ok = res.status === 409 && json.success === false && (json.error?.code === 'EMAIL_TAKEN' || json.error?.code === 'CONFLICT');
    recordTest('Duplicate Email Registration Rejection', ok, `Status: ${res.status}, Error Code: ${json.error?.code}, Message: ${json.error?.message}`);
  } catch (err) {
    recordTest('Duplicate Email Registration Rejection', false, err.message);
  }

  // Test 6: Invalid Login Credentials
  try {
    const res = await fetch(`${FRONTEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword999!' }),
    });
    const json = await res.json();
    const ok = res.status === 401 && json.success === false && json.error?.code === 'INVALID_CREDENTIALS';
    recordTest('Invalid Login Credentials Handling', ok, `Status: ${res.status}, Code: ${json.error?.code}`);
  } catch (err) {
    recordTest('Invalid Login Credentials Handling', false, err.message);
  }

  // Test 7: Successful Login & httpOnly Cookie Issuance
  let accessToken = null;
  let rawCookies = [];

  try {
    const res = await fetch(`${FRONTEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const json = await res.json();
    if (typeof res.headers.getSetCookie === 'function') {
      rawCookies = res.headers.getSetCookie();
    } else {
      const sc = res.headers.get('set-cookie');
      rawCookies = sc ? [sc] : [];
    }
    const hasRefreshTokenCookie = rawCookies.some((c) => c.includes('refreshToken=') && c.toLowerCase().includes('httponly'));
    accessToken = json.data?.accessToken;
    const ok = res.status === 200 && !!accessToken && hasRefreshTokenCookie;
    recordTest('Login & httpOnly Cookie Issuance', ok, `Status: ${res.status}, AccessToken: ${accessToken ? 'Issued' : 'Missing'}, Cookie: ${hasRefreshTokenCookie ? 'HttpOnly present' : 'Missing'}`);
  } catch (err) {
    recordTest('Login & httpOnly Cookie Issuance', false, err.message);
  }

  // Extract refreshToken cookie string for subsequent requests
  const cookieHeader = rawCookies
    .map((c) => c.split(';')[0])
    .join('; ');

  // Test 8: Authenticated User Profile (GET /api/auth/me)
  try {
    const res = await fetch(`${FRONTEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    const json = await res.json();
    const ok = res.status === 200 && json.success === true && json.data.user.email === testEmail;
    recordTest('Fetch User Profile (/api/auth/me)', ok, `Status: ${res.status}, Name: ${json.data?.user?.name}, Role: ${json.data?.user?.role}, Status: ${json.data?.user?.status}`);
  } catch (err) {
    recordTest('Fetch User Profile (/api/auth/me)', false, err.message);
  }

  // Test 9: Dashboard Summary API (GET /api/dashboard/summary)
  try {
    const res = await fetch(`${FRONTEND_URL}/api/dashboard/summary`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    const json = await res.json();
    const ok = res.status === 200 && json.success === true && json.data.stats !== undefined && json.data.indicators !== undefined;
    recordTest('Dashboard Summary Aggregation (/api/dashboard/summary)', ok, `Status: ${res.status}, Total Forecasts: ${json.data?.stats?.totalForecasts}, Top Location: ${json.data?.stats?.mostUsedLocation}, Source: ${json.data?.indicators?.source}`);
  } catch (err) {
    recordTest('Dashboard Summary Aggregation (/api/dashboard/summary)', false, err.message);
  }

  // Test 10: Weather / Solar Reference Data from MongoDB Atlas (GET /api/weather/solar-data)
  try {
    const res = await fetch(`${FRONTEND_URL}/api/weather/solar-data?limit=5`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    const json = await res.json();
    const records = json.data?.records || [];
    const ok = res.status === 200 && json.success === true && records.length > 0;
    recordTest('Reference Solar Benchmark Data (/api/weather/solar-data)', ok, `Status: ${res.status}, Records returned: ${records.length}, First GHI: ${records[0]?.ghiWm2} W/m2, Source: ${records[0]?.source}`);
  } catch (err) {
    recordTest('Reference Solar Benchmark Data (/api/weather/solar-data)', false, err.message);
  }

  // Test 11: Real Weather Proxy Endpoint (GET /api/weather/current)
  try {
    const res = await fetch(`${FRONTEND_URL}/api/weather/current?latitude=22.57&longitude=88.36`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    const json = await res.json();
    const current = json.data?.current;
    const ok = res.status === 200 && json.success === true && current?.temperatureC !== undefined;
    recordTest('Live Weather Proxy (/api/weather/current)', ok, `Status: ${res.status}, Temp: ${current?.temperatureC}°C, GHI: ${current?.ghiWm2} W/m2, Cloud: ${current?.cloudCoverPct}%`);
  } catch (err) {
    recordTest('Live Weather Proxy (/api/weather/current)', false, err.message);
  }

  // Test 12: Forecast Submission when ML is Unintegrated
  try {
    const res = await fetch(`${FRONTEND_URL}/api/forecasts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        locationQuery: 'Kolkata, India',
        targetDateTime: new Date(Date.now() + 86400000).toISOString(),
        systemCapacityKw: 50,
      }),
    });
    const json = await res.json();
    // ML microservice is offline, so backend correctly returns 503 ML_UNAVAILABLE
    const ok = res.status === 503 && json.error?.code === 'ML_UNAVAILABLE';
    recordTest('Forecast API with ML Service Offline State', ok, `Status: ${res.status}, Error Code: ${json.error?.code}, Message: ${json.error?.message}`);
  } catch (err) {
    recordTest('Forecast API with ML Service Offline State', false, err.message);
  }

  // Test 13: Refresh Token Session Restoration (POST /api/auth/refresh)
  let newAccessToken = null;
  try {
    const res = await fetch(`${FRONTEND_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: cookieHeader,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    const json = await res.json();
    newAccessToken = json.data?.accessToken;
    const ok = res.status === 200 && json.success === true && !!newAccessToken;
    recordTest('Refresh Token Rotation & Session Restore', ok, `Status: ${res.status}, New Token Issued: ${!!newAccessToken}, User restored: ${json.data?.user?.email}`);
  } catch (err) {
    recordTest('Refresh Token Rotation & Session Restore', false, err.message);
  }

  // Test 14: Logout & Invalidation of Refresh Session (POST /api/auth/logout)
  try {
    const res = await fetch(`${FRONTEND_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: cookieHeader,
        Authorization: `Bearer ${newAccessToken || accessToken}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    const json = await res.json();
    let setCookie = [];
    if (typeof res.headers.getSetCookie === 'function') {
      setCookie = res.headers.getSetCookie();
    } else {
      const sc = res.headers.get('set-cookie');
      setCookie = sc ? [sc] : [];
    }
    const cookieCleared = setCookie.some((c) => c.includes('refreshToken=;') || c.includes('Max-Age=0') || c.includes('expires='));
    const ok = res.status === 200 && json.data?.loggedOut === true && cookieCleared;
    recordTest('Logout & Cookie Revocation', ok, `Status: ${res.status}, LoggedOut: ${json.data?.loggedOut}, Cookie Cleared: ${cookieCleared}`);
  } catch (err) {
    recordTest('Logout & Cookie Revocation', false, err.message);
  }

  // Test 15: Protected Route Access After Logout with Revoked Cookie
  try {
    const res = await fetch(`${FRONTEND_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: cookieHeader, // Previously logged out cookie
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    const json = await res.json();
    const ok = res.status === 401 && json.success === false;
    recordTest('Protected Session Rejection After Logout', ok, `Status: ${res.status}, Code: ${json.error?.code || 'UNAUTHORIZED'}`);
  } catch (err) {
    recordTest('Protected Session Rejection After Logout', false, err.message);
  }

  // Test 16: Access Protected Route Without Token or Session
  try {
    const res = await fetch(`${FRONTEND_URL}/api/dashboard/summary`, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    const json = await res.json();
    const ok = res.status === 401 && json.success === false;
    recordTest('Unauthenticated Protected Route Rejection', ok, `Status: ${res.status}, Code: ${json.error?.code}`);
  } catch (err) {
    recordTest('Unauthenticated Protected Route Rejection', false, err.message);
  }

  console.log('\n--- TEST SUMMARY ---');
  const total = testResults.length;
  const passed = testResults.filter((t) => t.passed).length;
  const failed = total - passed;
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
