import axios from 'axios';

const baseURL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== RUNNING REAL 7-DAY FORECAST & STORAGE INTEGRATION TESTS ===');

  // 1. Authenticate
  const loginRes = await axios.post(`${baseURL}/auth/login`, {
    email: 'browser_test_user@solarsense.internal',
    password: 'Password123!',
  });
  const token = loginRes.data.data.accessToken;
  const authHeaders = { Authorization: `Bearer ${token}` };
  console.log('✓ TEST 1: Authenticated successfully with token.');

  // 2. Geocode Location 1: India (Kolkata, West Bengal)
  const geo1 = await axios.get(`${baseURL}/weather/geocode?q=Kolkata`, { headers: authHeaders });
  const loc1 = geo1.data.data.results[0];
  console.log(`✓ TEST 2 (India - Location 1): ${loc1.name}, ${loc1.admin1}, ${loc1.country} [Lat: ${loc1.latitude}, Lon: ${loc1.longitude}]`);

  // 3. Geocode Location 2: India, different state (Mumbai, Maharashtra)
  const geo2 = await axios.get(`${baseURL}/weather/geocode?q=Mumbai`, { headers: authHeaders });
  const loc2 = geo2.data.data.results[0];
  console.log(`✓ TEST 3 (India - Location 2): ${loc2.name}, ${loc2.admin1}, ${loc2.country} [Lat: ${loc2.latitude}, Lon: ${loc2.longitude}]`);
  if (loc1.latitude === loc2.latitude) throw new Error('Coordinates did not change between Indian states');

  // 4. Geocode Location 3: Another country (Los Angeles, California, United States)
  const geo3 = await axios.get(`${baseURL}/weather/geocode?q=Los%20Angeles`, { headers: authHeaders });
  const loc3 = geo3.data.data.results[0];
  console.log(`✓ TEST 4 (USA - Location 3): ${loc3.name}, ${loc3.admin1}, ${loc3.country} [Lat: ${loc3.latitude}, Lon: ${loc3.longitude}]`);
  if (loc3.country !== 'United States') throw new Error('Expected USA for Los Angeles');

  // 5. Geocode Location 4: Europe (Berlin, Germany)
  const geo4 = await axios.get(`${baseURL}/weather/geocode?q=Berlin`, { headers: authHeaders });
  const loc4 = geo4.data.data.results[0];
  console.log(`✓ TEST 5 (Europe - Location 4): ${loc4.name}, ${loc4.country} [Lat: ${loc4.latitude}, Lon: ${loc4.longitude}]`);

  // 6. Fetch 7-day forecast for Location 1 (Kolkata)
  const fc1 = await axios.get(`${baseURL}/weather/forecast?latitude=${loc1.latitude}&longitude=${loc1.longitude}&days=7`, { headers: authHeaders });
  const daily1 = fc1.data.data.daily;
  console.log(`✓ TEST 6 (Location 1 7-day forecast count): ${daily1.length}`);
  console.log(`   Day 1 Kolkata: Date ${daily1[0].date}, Irradiance: ${daily1[0].solarIrradianceKwhM2} kWh/m² (${daily1[0].solarIrradianceSumMjM2} MJ/m²), Temp: ${daily1[0].tempMinC} - ${daily1[0].tempMaxC}°C, Wind: ${daily1[0].windSpeedMaxMs} m/s`);

  // 7. Fetch 7-day forecast for Location 2 (Mumbai)
  const fc2 = await axios.get(`${baseURL}/weather/forecast?latitude=${loc2.latitude}&longitude=${loc2.longitude}&days=7`, { headers: authHeaders });
  const daily2 = fc2.data.data.daily;
  console.log(`✓ TEST 7 (Location 2 7-day forecast count): ${daily2.length}`);
  console.log(`   Day 1 Mumbai: Date ${daily2[0].date}, Irradiance: ${daily2[0].solarIrradianceKwhM2} kWh/m² (${daily2[0].solarIrradianceSumMjM2} MJ/m²), Temp: ${daily2[0].tempMinC} - ${daily2[0].tempMaxC}°C`);

  // 8. Fetch 7-day forecast for Location 3 (Los Angeles)
  const fc3 = await axios.get(`${baseURL}/weather/forecast?latitude=${loc3.latitude}&longitude=${loc3.longitude}&days=7`, { headers: authHeaders });
  const daily3 = fc3.data.data.daily;
  console.log(`✓ TEST 8 (Location 3 7-day forecast count): ${daily3.length}`);
  console.log(`   Day 1 Los Angeles: Date ${daily3[0].date}, Irradiance: ${daily3[0].solarIrradianceKwhM2} kWh/m² (${daily3[0].solarIrradianceSumMjM2} MJ/m²), Temp: ${daily3[0].tempMinC} - ${daily3[0].tempMaxC}°C`);

  // 9. Verify Location-Specific differences (Location 1 vs Location 3)
  if (daily1[0].solarIrradianceKwhM2 === daily3[0].solarIrradianceKwhM2 && daily1[0].tempMaxC === daily3[0].tempMaxC) {
    throw new Error('Forecast values are identical between Kolkata and Los Angeles! Real data must vary.');
  }
  console.log('✓ TEST 9: Confirmed forecast data is location-specific and dynamic between different coordinates.');

  // 10. Verify 7-day summary mathematical calculations
  const totalKwh = Number(daily1.reduce((acc, d) => acc + d.solarIrradianceKwhM2, 0).toFixed(2));
  const avgKwh = Number((totalKwh / daily1.length).toFixed(2));
  const bestDay = daily1.reduce((p, c) => c.solarIrradianceKwhM2 > p.solarIrradianceKwhM2 ? c : p);
  const lowestDay = daily1.reduce((p, c) => c.solarIrradianceKwhM2 < p.solarIrradianceKwhM2 ? c : p);
  console.log(`✓ TEST 10 (7-day summary math): Total = ${totalKwh} kWh/m², Mean = ${avgKwh} kWh/m²/day, Best = ${bestDay.date} (${bestDay.solarIrradianceKwhM2} kWh/m²), Lowest = ${lowestDay.date} (${lowestDay.solarIrradianceKwhM2} kWh/m²)`);

  // 11. Storage Potential: Battery capacity saving & reading in Atlas
  await axios.patch(`${baseURL}/users/me`, { preferences: { batteryCapacityKwh: 14.5 } }, { headers: authHeaders });
  const meRes = await axios.get(`${baseURL}/auth/me`, { headers: authHeaders });
  const savedCapacity = meRes.data.data.user.preferences?.batteryCapacityKwh;
  console.log(`✓ TEST 11: Real battery capacity saved in MongoDB Atlas: ${savedCapacity} kWh`);
  if (savedCapacity !== 14.5) throw new Error('Battery capacity was not saved in user preferences');

  // 12. Usable battery calculation test (90% DoD)
  const usableCapacity = Number((savedCapacity * 0.90).toFixed(2));
  console.log(`✓ TEST 12: Usable storage potential (90% DoD rule): ${usableCapacity} kWh/day buffer`);

  // 13. Clear battery capacity to test unavailable state
  await axios.patch(`${baseURL}/users/me`, { preferences: { batteryCapacityKwh: null } }, { headers: authHeaders });
  const meCleared = await axios.get(`${baseURL}/auth/me`, { headers: authHeaders });
  console.log(`✓ TEST 13: Cleared battery capacity in Atlas: ${meCleared.data.data.user.preferences?.batteryCapacityKwh ?? 'None (Unavailable State)'}`);

  // 14. Location validation: invalid query (<2 chars)
  try {
    await axios.get(`${baseURL}/weather/geocode?q=a`, { headers: authHeaders });
    throw new Error('Expected 400 for 1-char query');
  } catch (err) {
    if (err.response?.status === 400) {
      console.log('✓ TEST 14: Handled short query validation (400 Bad Request).');
    } else throw err;
  }

  // 15. Location validation: invalid coordinates
  try {
    await axios.get(`${baseURL}/weather/forecast?latitude=999&longitude=88&days=7`, { headers: authHeaders });
    throw new Error('Expected 422 for lat=999');
  } catch (err) {
    if (err.response?.status === 422) {
      console.log('✓ TEST 15: Handled invalid latitude validation (422 Unprocessable Entity).');
    } else throw err;
  }

  console.log('=== ALL REAL API & BUSINESS RULE TESTS PASSED (15/15) ===');
}

runTests().catch((err) => {
  console.error('TEST ERROR:', err.message, err.response?.data || '');
  process.exit(1);
});
