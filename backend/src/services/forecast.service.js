import { Forecast } from '../models/Forecast.js';
import { geocodeLocation, getHourlyWeather } from './weather.service.js';
import { predictSolarPower } from './mlClient.service.js';
import { getSetting } from './settings.service.js';
import { ApiError } from '../utils/ApiError.js';
import { logSystemEvent } from './log.service.js';
import { getPaginationParams, createPaginationMeta } from '../utils/pagination.js';
import { findActualSolarMeasurement } from './solarData.service.js';

export const createForecast = async ({
  userId,
  locationQuery,
  latitude,
  longitude,
  targetDateTime,
  systemCapacityKw,
  tiltDeg,
  azimuthDeg = 180,
  mode = 'day',
  weatherOverrides,
  requestId,
}) => {
  const startTime = Date.now();

  // 1. Horizon validation
  const targetDate = new Date(targetDateTime);
  const now = new Date();
  const maxHorizonDays = (await getSetting('forecastMaxHorizonDays')) || 7;
  const maxAllowedDate = new Date(now.getTime() + maxHorizonDays * 24 * 60 * 60 * 1000);

  // Allow target dates up to 30 days in the past to evaluate historical benchmark measurements
  if (targetDate < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) {
    throw ApiError.unprocessableEntity(
      'Target date/time cannot be older than 30 days.',
      'VALIDATION_ERROR',
      [{ field: 'targetDateTime', message: 'Target time cannot be older than 30 days' }]
    );
  }

  if (targetDate > maxAllowedDate) {
    throw ApiError.unprocessableEntity(
      `Target date exceeds the maximum allowable forecast horizon (${maxHorizonDays} days).`,
      'VALIDATION_ERROR',
      [{ field: 'targetDateTime', message: `Date must be within the next ${maxHorizonDays} days` }]
    );
  }

  // 2. Coordinate resolution
  let locName = locationQuery || 'Custom Coordinates';
  let lat = latitude;
  let lon = longitude;
  let tz = 'UTC';
  let country = '';

  if (locationQuery) {
    const geoResults = await geocodeLocation(locationQuery);
    const topGeo = geoResults[0];
    locName = `${topGeo.name}${topGeo.country ? ', ' + topGeo.country : ''}`;
    lat = topGeo.latitude;
    lon = topGeo.longitude;
    tz = topGeo.timezone || 'UTC';
    country = topGeo.country || '';
  }

  const targetDateStr = targetDate.toISOString().split('T')[0];

  // 3. Fetch meteorological snapshot
  let weatherResult;
  try {
    weatherResult = await getHourlyWeather(lat, lon, targetDateStr, tz);
  } catch (err) {
    // Record failed forecast attempt for diagnostics
    const failedForecast = await Forecast.create({
      userId,
      location: { name: locName, latitude: lat, longitude: lon, timezone: tz, country },
      targetDateTime: targetDate,
      mode,
      system: { capacityKw: systemCapacityKw, tiltDeg: tiltDeg ?? Math.round(Math.abs(lat)), azimuthDeg },
      weatherSnapshot: { source: 'failed', hourly: [] },
      status: 'failed',
      errorCode: 'WEATHER_UNAVAILABLE',
      errorMessage: 'External weather service was unreachable.',
      durationMs: Date.now() - startTime,
    });

    await logSystemEvent({
      level: 'error',
      type: 'forecast',
      action: 'FORECAST_FAILED',
      actorId: userId,
      targetType: 'Forecast',
      targetId: failedForecast._id,
      message: `Forecast generation failed: Weather API unavailable for ${locName}`,
      meta: { forecastId: failedForecast._id, error: err.message },
      requestId,
    });

    throw ApiError.badGateway('Weather data is temporarily unavailable. Please try again.', 'WEATHER_UNAVAILABLE');
  }

  let hourlyWeather = weatherResult.hourly;

  // Apply optional overrides if supplied
  if (weatherOverrides) {
    const targetHourStr = targetDate.toISOString().substring(0, 13);
    hourlyWeather = hourlyWeather.map((item) => {
      if (item.time.startsWith(targetHourStr)) {
        return {
          ...item,
          ...weatherOverrides,
          overridden: true,
        };
      }
      return item;
    });
  }

  // 4. Build feature vector instances for ML inference
  const instances = hourlyWeather.map((w) => ({
    timestamp: w.time,
    latitude: lat,
    longitude: lon,
    ghiWm2: w.ghiWm2,
    dniWm2: w.dniWm2,
    dhiWm2: w.dhiWm2,
    temperatureC: w.temperatureC,
    cloudCoverPct: w.cloudCoverPct,
    humidityPct: w.humidityPct,
    windSpeedMs: w.windSpeedMs,
    tiltDeg: tiltDeg ?? Math.round(Math.abs(lat)),
    azimuthDeg,
  }));

  // 5. Invoke ML Microservice
  let mlResult;
  try {
    mlResult = await predictSolarPower(instances, systemCapacityKw);
  } catch (err) {
    const failedForecast = await Forecast.create({
      userId,
      location: { name: locName, latitude: lat, longitude: lon, timezone: tz, country },
      targetDateTime: targetDate,
      mode,
      system: { capacityKw: systemCapacityKw, tiltDeg: tiltDeg ?? Math.round(Math.abs(lat)), azimuthDeg },
      weatherSnapshot: { source: weatherResult.source, fetchedAt: weatherResult.fetchedAt, hourly: hourlyWeather },
      features: instances,
      status: 'failed',
      errorCode: err.code || 'ML_PREDICTION_FAILED',
      errorMessage: err.message || 'Machine learning model evaluation failed.',
      durationMs: Date.now() - startTime,
    });

    await logSystemEvent({
      level: 'error',
      type: 'ml',
      action: 'FORECAST_FAILED',
      actorId: userId,
      targetType: 'Forecast',
      targetId: failedForecast._id,
      message: `Forecast generation failed: ML evaluation error for ${locName}`,
      meta: { forecastId: failedForecast._id, error: err.message },
      requestId,
    });

    throw err;
  }

  // 6. Shape output prediction
  const predictions = mlResult.predictions || [];
  const targetIsoHour = targetDate.toISOString().substring(0, 13);

  // Match target hour or closest hour
  let targetPred = predictions.find((p) => p.timestamp.startsWith(targetIsoHour));
  if (!targetPred && predictions.length > 0) {
    targetPred = predictions[0];
  }

  const targetPowerKw = targetPred ? targetPred.powerKw : 0.0;
  // Estimate daily energy in kWh (sum of hourly kW values)
  const dayEnergyKwh = Number(
    predictions.reduce((acc, p) => acc + (p.powerKw || 0.0), 0.0).toFixed(2)
  );

  const durationMs = Date.now() - startTime;

  const forecast = await Forecast.create({
    userId,
    location: { name: locName, latitude: lat, longitude: lon, timezone: tz, country },
    targetDateTime: targetDate,
    mode,
    system: { capacityKw: systemCapacityKw, tiltDeg: tiltDeg ?? Math.round(Math.abs(lat)), azimuthDeg },
    weatherSnapshot: {
      source: weatherResult.source,
      fetchedAt: weatherResult.fetchedAt,
      hourly: hourlyWeather,
    },
    features: instances,
    prediction: {
      targetPowerKw,
      unit: 'kW',
      hourly: predictions.map((p) => ({
        time: p.timestamp,
        powerKw: p.powerKw,
        capacityFactor: p.capacityFactor,
        solarElevationDeg: p.solarElevationDeg,
      })),
      dayEnergyKwh,
      confidence: {
        lowKw: Number(Math.max(0, targetPowerKw * 0.9).toFixed(3)),
        highKw: Number(Math.min(systemCapacityKw, targetPowerKw * 1.1).toFixed(3)),
      },
    },
    model: {
      name: mlResult.model?.name || 'GradientBoostingSolarEstimator',
      version: mlResult.model?.version || 'v1.0.0',
      trainedAt: new Date(),
    },
    status: 'completed',
    durationMs,
  });

  await logSystemEvent({
    level: 'info',
    type: 'forecast',
    action: 'FORECAST_COMPLETED',
    actorId: userId,
    targetType: 'Forecast',
    targetId: forecast._id,
    message: `Forecast generated for ${locName}: ${targetPowerKw} kW (${dayEnergyKwh} kWh) in ${durationMs}ms`,
    meta: {
      forecastId: forecast._id,
      targetPowerKw,
      dayEnergyKwh,
      durationMs,
      modelVersion: forecast.model.version,
    },
    requestId,
  });

  const forecastObj = forecast.toObject();
  try {
    const actualRecord = await findActualSolarMeasurement(lat, lon, targetDate);
    if (actualRecord && actualRecord.acPowerKw !== undefined && actualRecord.acPowerKw !== null) {
      const actualKw = Number(actualRecord.acPowerKw.toFixed(3));
      const diffKw = Number((targetPowerKw - actualKw).toFixed(3));
      const errorPct = actualKw > 0 ? Number(((Math.abs(diffKw) / actualKw) * 100).toFixed(2)) : 0;
      forecastObj.actualComparison = {
        actualPowerKw: actualKw,
        differenceKw: diffKw,
        errorPct,
        source: actualRecord.source,
        recordedAt: actualRecord.timestamp,
      };
    } else {
      forecastObj.actualComparison = null;
    }
  } catch {
    forecastObj.actualComparison = null;
  }

  return forecastObj;
};

export const getForecasts = async (userId, query, isAdmin = false) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  if (!isAdmin || !query.userId) {
    filter.userId = userId;
  } else if (query.userId) {
    filter.userId = query.userId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.model) {
    filter['model.version'] = query.model;
  }

  if (query.q || query.location) {
    const locSearch = query.q || query.location;
    filter['location.name'] = { $regex: locSearch.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), $options: 'i' };
  }

  if (query.from || query.to) {
    filter.targetDateTime = {};
    if (query.from) filter.targetDateTime.$gte = new Date(query.from);
    if (query.to) filter.targetDateTime.$lte = new Date(query.to);
  }

  const sortField = query.sort === 'power' ? 'prediction.targetPowerKw' : 'createdAt';
  const sortOrder = query.order === 'asc' ? 1 : -1;

  const [forecasts, total] = await Promise.all([
    Forecast.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email'),
    Forecast.countDocuments(filter),
  ]);

  return {
    forecasts,
    meta: createPaginationMeta(total, page, limit),
  };
};

export const getForecastById = async (id, userId, userRole = 'user') => {
  const forecast = await Forecast.findById(id).populate('userId', 'name email');
  if (!forecast) {
    throw ApiError.notFound('Forecast record not found.');
  }

  if (userRole !== 'admin' && forecast.userId._id.toString() !== userId.toString()) {
    // Avoid ID probing
    throw ApiError.notFound('Forecast record not found.');
  }

  const forecastObj = forecast.toObject();
  try {
    const actualRecord = await findActualSolarMeasurement(
      forecast.location.latitude,
      forecast.location.longitude,
      forecast.targetDateTime
    );
    if (actualRecord && actualRecord.acPowerKw !== undefined && actualRecord.acPowerKw !== null) {
      const actualKw = Number(actualRecord.acPowerKw.toFixed(3));
      const targetKw = Number(forecast.prediction?.targetPowerKw ?? 0);
      const diffKw = Number((targetKw - actualKw).toFixed(3));
      const errorPct = actualKw > 0 ? Number(((Math.abs(diffKw) / actualKw) * 100).toFixed(2)) : 0;
      forecastObj.actualComparison = {
        actualPowerKw: actualKw,
        differenceKw: diffKw,
        errorPct,
        source: actualRecord.source,
        recordedAt: actualRecord.timestamp,
      };
    } else {
      forecastObj.actualComparison = null;
    }
  } catch {
    forecastObj.actualComparison = null;
  }

  return forecastObj;
};

export const rerunForecast = async (id, userId, requestId) => {
  const existing = await Forecast.findById(id);
  if (!existing) {
    throw ApiError.notFound('Original forecast not found.');
  }

  if (existing.userId.toString() !== userId.toString()) {
    throw ApiError.notFound('Original forecast not found.');
  }

  return createForecast({
    userId,
    locationQuery: existing.location.name,
    latitude: existing.location.latitude,
    longitude: existing.location.longitude,
    targetDateTime: existing.targetDateTime.toISOString(),
    systemCapacityKw: existing.system.capacityKw,
    tiltDeg: existing.system.tiltDeg,
    azimuthDeg: existing.system.azimuthDeg,
    mode: existing.mode,
    requestId,
  });
};

export const deleteForecast = async (id, userId, userRole = 'user') => {
  const filter = { _id: id };
  if (userRole !== 'admin') {
    filter.userId = userId;
  }

  const deleted = await Forecast.findOneAndDelete(filter);
  if (!deleted) {
    throw ApiError.notFound('Forecast not found or already deleted.');
  }

  return { message: 'Forecast deleted successfully.' };
};

export const getUserForecastStats = async (userId, from, to) => {
  const match = { userId, status: 'completed' };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const stats = await Forecast.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalForecasts: { $sum: 1 },
        avgPowerKw: { $avg: '$prediction.targetPowerKw' },
        peakPowerKw: { $max: '$prediction.targetPowerKw' },
        totalEnergyKwh: { $sum: '$prediction.dayEnergyKwh' },
      },
    },
  ]);

  const topLocations = await Forecast.aggregate([
    { $match: match },
    { $group: { _id: '$location.name', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { location: '$_id', count: 1, _id: 0 } },
  ]);

  const byDay = await Forecast.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        avgPower: { $avg: '$prediction.targetPowerKw' },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 30 },
  ]);

  const summary = stats[0] || {
    totalForecasts: 0,
    avgPowerKw: 0,
    peakPowerKw: 0,
    totalEnergyKwh: 0,
  };

  return {
    total: summary.totalForecasts,
    avgPowerKw: Number((summary.avgPowerKw || 0).toFixed(2)),
    peakPowerKw: Number((summary.peakPowerKw || 0).toFixed(2)),
    totalEnergyKwh: Number((summary.totalEnergyKwh || 0).toFixed(2)),
    topLocations,
    byDay,
  };
};
