import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Forecast } from '../models/Forecast.js';
import { ApiError } from '../utils/ApiError.js';
import { logSystemEvent } from './log.service.js';

export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }
  return user;
};

export const updateMe = async (userId, updateData, requestId = null) => {
  const allowedUpdates = {};
  if (updateData.name !== undefined) allowedUpdates.name = updateData.name;
  if (updateData.phone !== undefined) allowedUpdates.phone = updateData.phone;
  if (updateData.organization !== undefined) allowedUpdates.organization = updateData.organization;
  if (updateData.preferences !== undefined) {
    allowedUpdates.preferences = updateData.preferences;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, { $set: allowedUpdates }, { new: true, runValidators: true });
  if (!updatedUser) {
    throw ApiError.notFound('User not found.');
  }

  await logSystemEvent({
    level: 'info',
    type: 'auth',
    action: 'PROFILE_UPDATED',
    actorId: updatedUser._id,
    targetType: 'User',
    targetId: updatedUser._id,
    message: `User ${updatedUser.email} updated profile.`,
    requestId,
  });

  return updatedUser;
};

export const deleteMe = async (userId, password, requestId = null) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw ApiError.unauthorized('Incorrect password. Account deletion aborted.', 'INVALID_CREDENTIALS');
  }

  if (user.role === 'admin') {
    const activeAdminsCount = await User.countDocuments({ role: 'admin', status: 'active' });
    if (activeAdminsCount <= 1) {
      throw ApiError.conflict('The last remaining active administrator account cannot be deleted.', 'LAST_ADMIN');
    }
  }

  // Delete all user forecasts
  const deletedForecasts = await Forecast.deleteMany({ userId: user._id });

  // Delete user record
  await User.findByIdAndDelete(userId);

  await logSystemEvent({
    level: 'warn',
    type: 'auth',
    action: 'ACCOUNT_DELETED',
    actorId: user._id,
    targetType: 'User',
    targetId: user._id,
    message: `User ${user.email} deleted their account and ${deletedForecasts.deletedCount} forecast records.`,
    requestId,
  });

  return { message: 'Account and associated forecasts deleted successfully.' };
};
