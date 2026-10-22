import { Forecast } from '../models/Forecast.js';
import { User } from '../models/User.js';
import { getHourlyWeather } from './weather.service.js';
import { findActualSolarMeasurement } from './solarData.service.js';

export const getPublicStats = async () => {
  const [totalForecasts, totalUsers] = await Promise.all([
    Forecast.countDocuments({ status: 'completed' }),
    User.countDocuments({ status: 'active' }),
  ]);

  return {
    totalForecasts,
    totalUsers,
  };
};

export const getDashboardSummary = async (userId) => {
  const [latestForecast, recentForecasts, totalForecasts, powerStats, topLocations, user] =
    await Promise.all([
      Forecast.findOne({ userId, status: 'completed' }).sort({ createdAt: -1 }),
      Forecast.find({ userId }).sort({ createdAt: -1 }).limit(5),
      Forecast.countDocuments({ userId, status: 'completed' }),
      Forecast.aggregate([
        { $match: { userId, status: 'completed' } },
        {
          $group: {
            _id: null,
            avgPowerKw: { $avg: '$prediction.targetPowerKw' },
            peakPowerKw: { $max: '$prediction.targetPowerKw' },
            totalEnergyKwh: { $sum: '$prediction.dayEnergyKwh' },
          },
        },
      ]),
      Forecast.aggregate([
        { $match: { userId, status: 'completed' } },
        { $group: { _id: '$location.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
      User.findById(userId),
    ]);

  const statsObj = powerStats[0] || {};
  const mostUsedLocation = topLocations[0]?._id || 'None';

  // Weather Indicators
  let indicators = {
    temperatureC: null,
    cloudCoverPct: null,
    humidityPct: null,
    windSpeedMs: null,
    ghiWm2: null,
    source: 'none',
  };

  if (latestForecast?.weatherSnapshot?.hourly?.length > 0) {
    const hourly = latestForecast.weatherSnapshot.hourly;
    // Find closest to target hour
    const targetIsoHour = latestForecast.targetDateTime.toISOString().substring(0, 13);
    const matched = hourly.find((h) => h.time.startsWith(targetIsoHour)) || hourly[0];
    indicators = {
      temperatureC: matched.temperatureC,
      cloudCoverPct: matched.cloudCoverPct,
      humidityPct: matched.humidityPct,
      windSpeedMs: matched.windSpeedMs,
      ghiWm2: matched.ghiWm2,
      source: 'latest_forecast',
      locationName: latestForecast.location.name,
    };
  } else if (user?.preferences?.defaultLocation?.latitude && user?.preferences?.defaultLocation?.longitude) {
    try {
      const defLoc = user.preferences.defaultLocation;
      const todayStr = new Date().toISOString().split('T')[0];
      const wx = await getHourlyWeather(defLoc.latitude, defLoc.longitude, todayStr, defLoc.timezone || 'UTC');
      if (wx.hourly.length > 0) {
        const curHour = new Date().getUTCHours();
        const matched = wx.hourly[curHour] || wx.hourly[0];
        indicators = {
          temperatureC: matched.temperatureC,
          cloudCoverPct: matched.cloudCoverPct,
          humidityPct: matched.humidityPct,
          windSpeedMs: matched.windSpeedMs,
          ghiWm2: matched.ghiWm2,
          source: 'default_location_live',
          locationName: defLoc.name,
        };
      }
    } catch {
      // Fallback indicators remain null
    }
  }

  let latestForecastObj = null;
  if (latestForecast) {
    latestForecastObj = latestForecast.toObject();
    try {
      const actualRecord = await findActualSolarMeasurement(
        latestForecast.location.latitude,
        latestForecast.location.longitude,
        latestForecast.targetDateTime
      );
      if (actualRecord && actualRecord.acPowerKw !== undefined && actualRecord.acPowerKw !== null) {
        const actualKw = Number(actualRecord.acPowerKw.toFixed(3));
        const targetKw = Number(latestForecast.prediction?.targetPowerKw ?? 0);
        const diffKw = Number((targetKw - actualKw).toFixed(3));
        const errorPct = actualKw > 0 ? Number(((Math.abs(diffKw) / actualKw) * 100).toFixed(2)) : 0;
        latestForecastObj.actualComparison = {
          actualPowerKw: actualKw,
          differenceKw: diffKw,
          errorPct,
          source: actualRecord.source,
          recordedAt: actualRecord.timestamp,
        };
      } else {
        latestForecastObj.actualComparison = null;
      }
    } catch {
      latestForecastObj.actualComparison = null;
    }
  }

  return {
    latestForecast: latestForecastObj,
    recentForecasts,
    stats: {
      totalForecasts,
      avgPowerKw: Number((statsObj.avgPowerKw || 0).toFixed(2)),
      peakPowerKw: Number((statsObj.peakPowerKw || 0).toFixed(2)),
      totalEnergyKwh: Number((statsObj.totalEnergyKwh || 0).toFixed(2)),
      mostUsedLocation,
    },
    indicators,
  };
};
