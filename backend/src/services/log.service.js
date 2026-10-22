import { SystemLog } from '../models/SystemLog.js';
import { logger } from '../config/logger.js';

export const logSystemEvent = async ({
  level = 'info',
  type = 'system',
  action,
  actorId = null,
  targetType = null,
  targetId = null,
  message,
  meta = null,
  requestId = null,
}) => {
  try {
    await SystemLog.create({
      level,
      type,
      action,
      actorId,
      targetType,
      targetId,
      message,
      meta,
      requestId,
    });
  } catch (err) {
    logger.error({ err, action, message }, 'Failed to persist system log event');
  }
};
