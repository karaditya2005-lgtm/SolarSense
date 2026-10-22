import { Setting } from '../models/Setting.js';
import { logSystemEvent } from './log.service.js';
import { ApiError } from '../utils/ApiError.js';

const DEFAULT_SETTINGS = {
  forecastMaxHorizonDays: { value: 7, type: 'number', description: 'Maximum horizon days for solar forecasts' },
  registrationEnabled: { value: true, type: 'boolean', description: 'Allow new user public registrations' },
  weatherCacheTtlMinutes: { value: 60, type: 'number', description: 'TTL in minutes for cached weather snapshots' },
  defaultModelVersion: { value: 'v1.0.0', type: 'string', description: 'Active default ML model version' },
  maintenanceMode: { value: false, type: 'boolean', description: 'Enable global maintenance mode banner' },
};

export const getSetting = async (key) => {
  const setting = await Setting.findOne({ key });
  if (setting) {
    return setting.value;
  }
  return DEFAULT_SETTINGS[key]?.value;
};

export const getAllSettings = async () => {
  const settings = await Setting.find().sort({ key: 1 });
  return settings;
};

export const updateSetting = async (key, value, adminUser, requestId = null) => {
  const setting = await Setting.findOne({ key });
  if (!setting) {
    throw ApiError.notFound(`Setting with key '${key}' does not exist.`);
  }

  // Type check
  if (setting.type === 'number' && typeof value !== 'number') {
    throw ApiError.unprocessableEntity(`Setting '${key}' must be a number.`);
  }
  if (setting.type === 'boolean' && typeof value !== 'boolean') {
    throw ApiError.unprocessableEntity(`Setting '${key}' must be a boolean.`);
  }
  if (setting.type === 'string' && typeof value !== 'string') {
    throw ApiError.unprocessableEntity(`Setting '${key}' must be a string.`);
  }

  const oldValue = setting.value;
  setting.value = value;
  setting.updatedBy = adminUser._id;
  await setting.save();

  await logSystemEvent({
    level: 'info',
    type: 'admin',
    action: 'SETTING_UPDATED',
    actorId: adminUser._id,
    targetType: 'Setting',
    targetId: setting._id,
    message: `Admin ${adminUser.email} updated setting '${key}' from '${oldValue}' to '${value}'`,
    meta: { key, oldValue, newValue: value },
    requestId,
  });

  return setting;
};

export const seedDefaultSettings = async () => {
  for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
    const exists = await Setting.findOne({ key });
    if (!exists) {
      await Setting.create({
        key,
        value: config.value,
        type: config.type,
        description: config.description,
      });
    }
  }
};
