import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logSystemEvent } from './log.service.js';
import { getSetting } from './settings.service.js';

// Dummy hash for constant-time comparison when user does not exist
const DUMMY_HASH = '$2a$12$e8x5a317s6e2q1u4t0i5.eU2Z8C9g4.m4k5N6p7q8r9s0t1u2v3w4';

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

export const registerUser = async ({ name, email, password, ip, userAgent, requestId }) => {
  const registrationEnabled = await getSetting('registrationEnabled');
  if (registrationEnabled === false) {
    throw ApiError.forbidden('Public user registrations are currently disabled by the administrator.', 'REGISTRATION_DISABLED');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists.', 'EMAIL_TAKEN');
  }

  const saltRounds = env.BCRYPT_SALT_ROUNDS || 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: 'user',
    status: 'active',
  });

  await logSystemEvent({
    level: 'info',
    type: 'auth',
    action: 'USER_REGISTERED',
    actorId: user._id,
    targetType: 'User',
    targetId: user._id,
    message: `New user registered: ${user.email}`,
    meta: { ip, userAgent },
    requestId,
  });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
};

export const loginUser = async ({ email, password, ip, userAgent, requestId }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash +refreshTokens');

  const passwordMatch = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, DUMMY_HASH);

  if (!user || !passwordMatch) {
    throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  if (user.status === 'suspended') {
    throw ApiError.forbidden('Your account has been suspended. Please contact support.', 'ACCOUNT_SUSPENDED');
  }

  const accessToken = generateAccessToken(user);
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashToken(rawRefreshToken);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Keep max 5 active refresh tokens per user
  const activeTokens = (user.refreshTokens || []).slice(-4);
  activeTokens.push({
    tokenHash,
    expiresAt,
    createdAt: new Date(),
    userAgent,
    ip,
  });

  user.refreshTokens = activeTokens;
  user.lastLoginAt = new Date();
  await user.save();

  await logSystemEvent({
    level: 'info',
    type: 'auth',
    action: 'USER_LOGIN',
    actorId: user._id,
    targetType: 'User',
    targetId: user._id,
    message: `User logged in: ${user.email}`,
    meta: { ip, userAgent },
    requestId,
  });

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      preferences: user.preferences,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken: rawRefreshToken,
    refreshTokenExpiresAt: expiresAt,
  };
};

export const refreshSession = async ({ rawRefreshToken, ip, userAgent, requestId }) => {
  if (!rawRefreshToken) {
    throw ApiError.unauthorized('Refresh token is required.', 'TOKEN_INVALID');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const user = await User.findOne({ 'refreshTokens.tokenHash': tokenHash }).select('+refreshTokens');

  if (!user) {
    // Possible token reuse attack or invalid token
    throw ApiError.unauthorized('Invalid or expired refresh session. Please log in again.', 'TOKEN_INVALID');
  }

  if (user.status === 'suspended') {
    throw ApiError.forbidden('Your account has been suspended.', 'ACCOUNT_SUSPENDED');
  }

  const matchedToken = user.refreshTokens.find((t) => t.tokenHash === tokenHash);
  if (!matchedToken || matchedToken.expiresAt < new Date()) {
    // Remove expired token
    user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== tokenHash);
    await user.save();
    throw ApiError.unauthorized('Session has expired. Please log in again.', 'TOKEN_EXPIRED');
  }

  // Token Rotation: issue new access & refresh token, remove old refresh token
  const newAccessToken = generateAccessToken(user);
  const newRawRefreshToken = generateRefreshToken();
  const newTokenHash = hashToken(newRawRefreshToken);
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  user.refreshTokens = user.refreshTokens
    .filter((t) => t.tokenHash !== tokenHash)
    .slice(-4);

  user.refreshTokens.push({
    tokenHash: newTokenHash,
    expiresAt: newExpiresAt,
    createdAt: new Date(),
    userAgent,
    ip,
  });

  await user.save();

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      preferences: user.preferences,
    },
    accessToken: newAccessToken,
    refreshToken: newRawRefreshToken,
    refreshTokenExpiresAt: newExpiresAt,
  };
};

export const logoutUser = async ({ rawRefreshToken, userId }) => {
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    await User.updateOne(
      { 'refreshTokens.tokenHash': tokenHash },
      { $pull: { refreshTokens: { tokenHash } } }
    );
  } else if (userId) {
    await User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } });
  }
};

export const changeUserPassword = async ({ userId, currentPassword, newPassword, requestId }) => {
  const user = await User.findById(userId).select('+passwordHash +refreshTokens');
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) {
    throw ApiError.unauthorized('Current password does not match.', 'INVALID_CREDENTIALS');
  }

  const saltRounds = env.BCRYPT_SALT_ROUNDS || 12;
  user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
  user.passwordChangedAt = new Date();
  // Invalidate all other active sessions
  user.refreshTokens = [];
  await user.save();

  await logSystemEvent({
    level: 'info',
    type: 'auth',
    action: 'PASSWORD_CHANGED',
    actorId: user._id,
    targetType: 'User',
    targetId: user._id,
    message: `Password changed for user ${user.email}. All refresh sessions revoked.`,
    requestId,
  });

  return { message: 'Password changed successfully. Please log in with your new credentials.' };
};
