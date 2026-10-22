import {
  createForecast,
  getForecasts,
  getForecastById,
  rerunForecast,
  deleteForecast,
  getUserForecastStats,
} from '../services/forecast.service.js';
import { getMlModelInfo } from '../services/mlClient.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const create = asyncHandler(async (req, res) => {
  const forecast = await createForecast({
    userId: req.user._id,
    locationQuery: req.body.locationQuery,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    targetDateTime: req.body.targetDateTime,
    systemCapacityKw: req.body.systemCapacityKw,
    tiltDeg: req.body.tiltDeg,
    azimuthDeg: req.body.azimuthDeg,
    mode: req.body.mode,
    weatherOverrides: req.body.weatherOverrides,
    requestId: req.id,
  });

  return sendSuccess(res, { forecast }, 201);
});

export const list = asyncHandler(async (req, res) => {
  const result = await getForecasts(req.user._id, req.query, false);
  return sendSuccess(res, { forecasts: result.forecasts }, 200, result.meta);
});

export const getById = asyncHandler(async (req, res) => {
  const forecast = await getForecastById(req.params.id, req.user._id, req.user.role);
  return sendSuccess(res, { forecast }, 200);
});

export const rerun = asyncHandler(async (req, res) => {
  const forecast = await rerunForecast(req.params.id, req.user._id, req.id);
  return sendSuccess(res, { forecast }, 201);
});

export const remove = asyncHandler(async (req, res) => {
  await deleteForecast(req.params.id, req.user._id, req.user.role);
  return sendSuccess(res, { message: 'Forecast deleted successfully.' }, 200);
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await getUserForecastStats(req.user._id, req.query.from, req.query.to);
  return sendSuccess(res, stats, 200);
});

export const getActiveModelInfo = asyncHandler(async (req, res) => {
  const modelInfo = await getMlModelInfo();
  return sendSuccess(res, modelInfo, 200);
});
