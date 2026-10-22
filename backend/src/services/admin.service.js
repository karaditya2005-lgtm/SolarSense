import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Forecast } from '../models/Forecast.js';
import { ContactMessage } from '../models/ContactMessage.js';
import { SystemLog } from '../models/SystemLog.js';
import { env } from '../config/env.js';
import { getMlModelInfo, checkMlHealth } from './mlClient.service.js';
import { ApiError } from '../utils/ApiError.js';
import { logSystemEvent } from './log.service.js';
import { getPaginationParams, createPaginationMeta } from '../utils/pagination.js';


export const getAdminStats = async () => {
  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalAdmins,
    totalForecasts,
    completedForecasts,
    failedForecasts,
    last24hForecasts,
    mlHealth,
    recentActivity,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'suspended' }),
    User.countDocuments({ role: 'admin' }),
    Forecast.countDocuments(),
    Forecast.countDocuments({ status: 'completed' }),
    Forecast.countDocuments({ status: 'failed' }),
    Forecast.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
    checkMlHealth(),
    SystemLog.find().sort({ createdAt: -1 }).limit(15).populate('actorId', 'name email'),
  ]);

  // Forecasts per day over last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const perDay = await Forecast.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const failureRate =
    totalForecasts > 0 ? Number(((failedForecasts / totalForecasts) * 100).toFixed(2)) : 0;

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      suspended: suspendedUsers,
      admins: totalAdmins,
    },
    forecasts: {
      total: totalForecasts,
      completed: completedForecasts,
      failed: failedForecasts,
      last24h: last24hForecasts,
      failureRatePct: failureRate,
    },
    perDay,
    ml: {
      status: mlHealth.status || 'unknown',
      modelLoaded: mlHealth.modelLoaded || false,
      modelVersion: mlHealth.modelVersion || 'unknown',
    },
    recentActivity,
  };
};

export const getAdminUsers = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;
  if (query.q) {
    const searchRegex = { $regex: query.q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), $options: 'i' };
    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  const sortField = query.sort === 'lastLogin' ? 'lastLoginAt' : 'createdAt';
  const sortOrder = query.order === 'asc' ? 1 : -1;

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  // Enrich with forecast counts
  const userIds = users.map((u) => u._id);
  const forecastCounts = await Forecast.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
  ]);

  const countsMap = {};
  forecastCounts.forEach((c) => {
    countsMap[c._id.toString()] = c.count;
  });

  const enrichedUsers = users.map((u) => ({
    ...u.toObject(),
    forecastCount: countsMap[u._id.toString()] || 0,
  }));

  return {
    users: enrichedUsers,
    meta: createPaginationMeta(total, page, limit),
  };
};

export const getAdminUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  const forecastCount = await Forecast.countDocuments({ userId: user._id });
  const recentForecasts = await Forecast.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(5);

  return {
    user,
    forecastCount,
    recentForecasts,
  };
};

export const updateAdminUser = async (id, updateData, adminUser, requestId = null) => {
  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw ApiError.notFound('User not found.');
  }

  // Prevent self-demotion or self-suspension
  if (targetUser._id.toString() === adminUser._id.toString()) {
    if (updateData.status === 'suspended' || (updateData.role && updateData.role !== 'admin')) {
      throw ApiError.forbidden('Administrators cannot suspend or demote their own account.', 'FORBIDDEN');
    }
  }

  // Guard: Last remaining active admin cannot be demoted or suspended
  if (targetUser.role === 'admin') {
    const isDemoting = updateData.role && updateData.role !== 'admin';
    const isSuspending = updateData.status === 'suspended';

    if (isDemoting || isSuspending) {
      const activeAdmins = await User.countDocuments({ role: 'admin', status: 'active' });
      if (activeAdmins <= 1) {
        throw ApiError.conflict('Cannot modify role or suspend the last remaining active administrator.', 'LAST_ADMIN');
      }
    }
  }

  const allowed = {};
  if (updateData.role) allowed.role = updateData.role;
  if (updateData.status) allowed.status = updateData.status;
  if (updateData.name) allowed.name = updateData.name;

  const updated = await User.findByIdAndUpdate(id, { $set: allowed }, { new: true, runValidators: true });

  await logSystemEvent({
    level: 'info',
    type: 'admin',
    action: 'USER_UPDATED_BY_ADMIN',
    actorId: adminUser._id,
    targetType: 'User',
    targetId: updated._id,
    message: `Admin ${adminUser.email} updated user ${updated.email} (Role: ${updated.role}, Status: ${updated.status})`,
    meta: { changes: allowed },
    requestId,
  });

  return updated;
};

export const deleteAdminUser = async (id, deleteForecasts = true, adminUser, requestId = null) => {
  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw ApiError.notFound('User not found.');
  }

  // Cannot delete self
  if (targetUser._id.toString() === adminUser._id.toString()) {
    throw ApiError.forbidden('Administrators cannot delete their own account from the admin panel.', 'FORBIDDEN');
  }

  // Last admin guard
  if (targetUser.role === 'admin') {
    const activeAdmins = await User.countDocuments({ role: 'admin', status: 'active' });
    if (activeAdmins <= 1) {
      throw ApiError.conflict('Cannot delete the last remaining active administrator.', 'LAST_ADMIN');
    }
  }

  let deletedForecastsCount = 0;
  if (deleteForecasts === true || deleteForecasts === 'true') {
    const res = await Forecast.deleteMany({ userId: targetUser._id });
    deletedForecastsCount = res.deletedCount;
  }

  await User.findByIdAndDelete(id);

  await logSystemEvent({
    level: 'warn',
    type: 'admin',
    action: 'USER_DELETED_BY_ADMIN',
    actorId: adminUser._id,
    targetType: 'User',
    targetId: id,
    message: `Admin ${adminUser.email} deleted user ${targetUser.email} and ${deletedForecastsCount} forecasts.`,
    meta: { deletedUserId: id, deletedForecastsCount },
    requestId,
  });

  return { message: 'User deleted successfully.' };
};

export const getAdminForecastActivity = async (days = 30) => {
  const numDays = Math.min(Math.max(parseInt(days, 10) || 30, 1), 90);
  const cutoff = new Date(Date.now() - numDays * 24 * 60 * 60 * 1000);

  const perDay = await Forecast.aggregate([
    { $match: { createdAt: { $gte: cutoff } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        avgDurationMs: { $avg: '$durationMs' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byStatus = await Forecast.aggregate([
    { $match: { createdAt: { $gte: cutoff } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusMap = { completed: 0, failed: 0, pending: 0 };
  byStatus.forEach((s) => {
    statusMap[s._id] = s.count;
  });

  return {
    perDay,
    byStatus: statusMap,
    daysRequested: numDays,
  };
};

export const getAdminMessages = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};
  if (query.status) filter.status = query.status;

  const [messages, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ContactMessage.countDocuments(filter),
  ]);

  return {
    messages,
    meta: createPaginationMeta(total, page, limit),
  };
};

export const updateAdminMessageStatus = async (id, status, adminUser, requestId = null) => {
  const message = await ContactMessage.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true, runValidators: true }
  );

  if (!message) {
    throw ApiError.notFound('Contact message not found.');
  }

  await logSystemEvent({
    level: 'info',
    type: 'admin',
    action: 'CONTACT_MESSAGE_STATUS_UPDATED',
    actorId: adminUser._id,
    targetType: 'ContactMessage',
    targetId: message._id,
    message: `Admin ${adminUser.email} marked message from ${message.email} as ${status}`,
    requestId,
  });

  return message;
};

export const deleteAdminMessage = async (id, adminUser, requestId = null) => {
  const message = await ContactMessage.findByIdAndDelete(id);
  if (!message) {
    throw ApiError.notFound('Contact message not found.');
  }

  await logSystemEvent({
    level: 'warn',
    type: 'admin',
    action: 'CONTACT_MESSAGE_DELETED',
    actorId: adminUser._id,
    targetType: 'ContactMessage',
    targetId: id,
    message: `Admin ${adminUser.email} deleted contact message ${id}`,
    requestId,
  });

  return { message: 'Message deleted successfully.' };
};

export const getAdminLogs = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  if (query.level) filter.level = query.level;
  if (query.type) filter.type = query.type;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  const [logs, total] = await Promise.all([
    SystemLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'name email'),
    SystemLog.countDocuments(filter),
  ]);

  return {
    logs,
    meta: createPaginationMeta(total, page, limit),
  };
};

export const ensureDesignatedAdmin = async () => {
  const email = (env.ADMIN_SEED_EMAIL || 'admin@solarsense.internal').toLowerCase().trim();
  const existing = await User.findOne({ email }).select('+passwordHash');

  const saltRounds = env.BCRYPT_SALT_ROUNDS || 12;
  const password = env.ADMIN_SEED_PASSWORD || 'Admin@SolarSense2026!';

  if (existing) {
    let modified = false;
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      modified = true;
    }
    if (existing.status !== 'active') {
      existing.status = 'active';
      modified = true;
    }
    const matches = existing.passwordHash ? await bcrypt.compare(password, existing.passwordHash) : false;
    if (!matches) {
      existing.passwordHash = await bcrypt.hash(password, saltRounds);
      modified = true;
    }
    if (modified) {
      await existing.save();
    }
    return existing;
  }

  const passwordHash = await bcrypt.hash(password, saltRounds);

  const admin = await User.create({
    name: env.ADMIN_SEED_NAME || 'System Administrator',
    email,
    passwordHash,
    role: 'admin',
    status: 'active',
    preferences: {
      units: 'metric',
      defaultCapacityKw: 10.0,
    },
  });

  return admin;
};


