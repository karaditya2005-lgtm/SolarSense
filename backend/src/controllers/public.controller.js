import mongoose from 'mongoose';
import { getPublicStats, getDashboardSummary } from '../services/stats.service.js';
import { checkMlHealth } from '../services/mlClient.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const healthCheck = asyncHandler(async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'ok' : 'down';
  const mlStatus = await checkMlHealth();

  return res.status(200).json({
    success: true,
    message: 'SolarSense API is running',
    data: {
      api: 'ok',
      db: dbStatus,
      ml: mlStatus.status === 'ok' ? 'ok' : 'down',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});

export const publicStats = asyncHandler(async (req, res) => {
  const stats = await getPublicStats();
  return sendSuccess(res, stats, 200);
});

export const dashboardSummary = asyncHandler(async (req, res) => {
  const summary = await getDashboardSummary(req.user._id);
  return sendSuccess(res, summary, 200);
});
