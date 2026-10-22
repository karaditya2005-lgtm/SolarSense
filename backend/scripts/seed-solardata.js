import axios from 'axios';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { SolarData } from '../src/models/SolarData.js';
import { User } from '../src/models/User.js';
import { logger } from '../src/config/logger.js';
import { env } from '../src/config/env.js';

const run = async () => {
  try {
    await connectDB();

    const existingCount = await SolarData.countDocuments();
    if (existingCount > 0) {
      logger.info(`SolarData collection already has ${existingCount} benchmark records.`);
      return;
    }

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      logger.warn('No admin user found. Please run seed:admin first.');
      return;
    }

    logger.info('Fetching real benchmark solar radiation data from Open-Meteo...');
    const lat = 28.61;
    const lon = 77.20;
    const locationName = 'New Delhi Solar Station';

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const response = await axios.get(env.WEATHER_API_BASE_URL, {
      params: {
        latitude: lat,
        longitude: lon,
        start_date: dateStr,
        end_date: dateStr,
        hourly: [
          'temperature_2m',
          'relative_humidity_2m',
          'cloud_cover',
          'wind_speed_10m',
          'shortwave_radiation_instant',
          'direct_normal_irradiance_instant',
          'diffuse_radiation_instant',
        ].join(','),
        timezone: 'Asia/Kolkata',
      },
      timeout: 10000,
    });

    const hourly = response.data?.hourly;
    if (!hourly || !hourly.time) {
      logger.error('Failed to retrieve real solar observations from Open-Meteo');
      return;
    }

    const records = [];
    const capacityKw = 10.0; // 10 kW reference benchmark system

    for (let i = 0; i < hourly.time.length; i++) {
      const ghi = Math.max(0, Number(hourly.shortwave_radiation_instant[i] ?? 0));
      const dni = Math.max(0, Number(hourly.direct_normal_irradiance_instant[i] ?? 0));
      const dhi = Math.max(0, Number(hourly.diffuse_radiation_instant[i] ?? 0));
      const temp = Number(hourly.temperature_2m[i] ?? 25);
      const cloud = Number(hourly.cloud_cover[i] ?? 0);
      const humidity = Number(hourly.relative_humidity_2m[i] ?? 50);
      const wind = Number(hourly.wind_speed_10m[i] ?? 2);

      // Estimated physical PV power output based on standard temperature coefficient:
      // P = Capacity * (GHI / 1000) * (1 - 0.004 * (CellTemp - 25)) * PR (0.85)
      const cellTemp = temp + (ghi / 800) * 25;
      const tempDerate = 1 - 0.004 * (cellTemp - 25);
      const acPower = ghi > 10 ? Math.max(0, Math.min(capacityKw, capacityKw * (ghi / 1000) * tempDerate * 0.85)) : 0;

      records.push({
        location: {
          name: locationName,
          latitude: lat,
          longitude: lon,
          timezone: 'Asia/Kolkata',
        },
        timestamp: new Date(hourly.time[i] + ':00Z'),
        ghiWm2: ghi,
        dniWm2: dni,
        dhiWm2: dhi,
        temperatureC: temp,
        cloudCoverPct: cloud,
        humidityPct: humidity,
        windSpeedMs: wind,
        acPowerKw: Math.round(acPower * 100) / 100,
        capacityKw,
        source: 'open-meteo:benchmark_real',
        createdBy: admin._id,
      });
    }

    const inserted = await SolarData.insertMany(records, { ordered: false });
    logger.info(`Successfully seeded ${inserted.length} real solar benchmark records into MongoDB Atlas.`);
  } catch (err) {
    logger.error({ err: err.message }, 'Error in seed-solardata script');
  } finally {
    await disconnectDB();
  }
};

run();
