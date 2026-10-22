import {
  getAdminStats,
  getAdminUsers,
  getAdminUserById,
  updateAdminUser,
  deleteAdminUser,
  getAdminForecastActivity,
  getAdminMessages,
  updateAdminMessageStatus,
  deleteAdminMessage,
  getAdminLogs,
} from '../services/admin.service.js';
import {
  getSolarDataList,
  getSolarDataById,
  createSolarDataRecord,
  updateSolarDataRecord,
  deleteSolarDataRecord,
  importSolarDataCsv,
  exportSolarDataCsv,
} from '../services/solarData.service.js';
import { getForecasts, getForecastById, deleteForecast } from '../services/forecast.service.js';
import { getAllSettings, updateSetting } from '../services/settings.service.js';
import { getMlModelInfo } from '../services/mlClient.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const stats = asyncHandler(async (req, res) => {
  const result = await getAdminStats();
  return sendSuccess(res, result, 200);
});

export const listUsers = asyncHandler(async (req, res) => {
  const result = await getAdminUsers(req.query);
  return sendSuccess(res, { users: result.users }, 200, result.meta);
});

export const getUserById = asyncHandler(async (req, res) => {
  const result = await getAdminUserById(req.params.id);
  return sendSuccess(res, result, 200);
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await updateAdminUser(req.params.id, req.body, req.user, req.id);
  return sendSuccess(res, { user }, 200);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const deleteForecasts = req.query.deleteForecasts === 'true';
  await deleteAdminUser(req.params.id, deleteForecasts, req.user, req.id);
  return res.status(204).send();
});

export const listSolarData = asyncHandler(async (req, res) => {
  const result = await getSolarDataList(req.query);
  return sendSuccess(res, { records: result.records }, 200, result.meta);
});

export const getSolarDataRecord = asyncHandler(async (req, res) => {
  const record = await getSolarDataById(req.params.id);
  return sendSuccess(res, { record }, 200);
});

export const createSolarData = asyncHandler(async (req, res) => {
  const record = await createSolarDataRecord(req.body, req.user, req.id);
  return sendSuccess(res, { record }, 201);
});

export const updateSolarData = asyncHandler(async (req, res) => {
  const record = await updateSolarDataRecord(req.params.id, req.body, req.user, req.id);
  return sendSuccess(res, { record }, 200);
});

export const deleteSolarData = asyncHandler(async (req, res) => {
  await deleteSolarDataRecord(req.params.id, req.user, req.id);
  return res.status(204).send();
});

export const importSolarData = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) {
    throw ApiError.badRequest('CSV file is required for upload.');
  }
  const report = await importSolarDataCsv(req.file.buffer, req.user, req.id);
  return sendSuccess(res, report, 200);
});

export const exportSolarData = asyncHandler(async (req, res) => {
  await exportSolarDataCsv(req.query, res);
});

export const listForecasts = asyncHandler(async (req, res) => {
  const result = await getForecasts(null, req.query, true);
  return sendSuccess(res, { forecasts: result.forecasts }, 200, result.meta);
});

export const getForecast = asyncHandler(async (req, res) => {
  const forecast = await getForecastById(req.params.id, null, 'admin');
  return sendSuccess(res, { forecast }, 200);
});

export const deleteForecastAdmin = asyncHandler(async (req, res) => {
  await deleteForecast(req.params.id, null, 'admin');
  return res.status(204).send();
});

export const forecastActivity = asyncHandler(async (req, res) => {
  const activity = await getAdminForecastActivity(req.query.days);
  return sendSuccess(res, activity, 200);
});

export const listMessages = asyncHandler(async (req, res) => {
  const result = await getAdminMessages(req.query);
  return sendSuccess(res, { messages: result.messages }, 200, result.meta);
});

export const updateMessageStatus = asyncHandler(async (req, res) => {
  const message = await updateAdminMessageStatus(req.params.id, req.body.status, req.user, req.id);
  return sendSuccess(res, { message }, 200);
});

export const deleteMessage = asyncHandler(async (req, res) => {
  await deleteAdminMessage(req.params.id, req.user, req.id);
  return res.status(204).send();
});

export const listSettings = asyncHandler(async (req, res) => {
  const settings = await getAllSettings();
  return sendSuccess(res, { settings }, 200);
});

export const updateSettingKey = asyncHandler(async (req, res) => {
  const setting = await updateSetting(req.params.key, req.body.value, req.user, req.id);
  return sendSuccess(res, { setting }, 200);
});

export const listLogs = asyncHandler(async (req, res) => {
  const result = await getAdminLogs(req.query);
  return sendSuccess(res, { logs: result.logs }, 200, result.meta);
});

export const getModelInfo = asyncHandler(async (req, res) => {
  const modelInfo = await getMlModelInfo();
  return sendSuccess(res, modelInfo, 200);
});
