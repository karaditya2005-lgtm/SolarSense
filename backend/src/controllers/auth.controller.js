import {
  registerUser,
  loginUser,
  refreshSession,
  logoutUser,
  changeUserPassword,
} from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const setRefreshTokenCookie = (res, token, expiresAt) => {
  const cookieOptions = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: '/api/auth',
    expires: expiresAt,
  };
  if (env.COOKIE_DOMAIN) {
    cookieOptions.domain = env.COOKIE_DOMAIN;
  }
  res.cookie('refreshToken', token, cookieOptions);
};

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.id,
  });

  return sendSuccess(res, { user: result }, 201);
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser({
    email: req.body.email,
    password: req.body.password,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.id,
  });

  setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);

  return sendSuccess(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
    },
    200
  );
});

export const refresh = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;
  const result = await refreshSession({
    rawRefreshToken,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.id,
  });

  setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);

  return sendSuccess(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
    },
    200
  );
});

export const logout = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;
  await logoutUser({ rawRefreshToken, userId: req.user?._id });

  const clearOptions = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: '/api/auth',
  };
  if (env.COOKIE_DOMAIN) {
    clearOptions.domain = env.COOKIE_DOMAIN;
  }
  res.clearCookie('refreshToken', clearOptions);

  return sendSuccess(res, { loggedOut: true, message: 'Logged out successfully' }, 200);
});

export const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, { user: req.user }, 200);
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await changeUserPassword({
    userId: req.user._id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
    requestId: req.id,
  });

  // Clear cookie since all other sessions are revoked
  res.clearCookie('refreshToken', { path: '/api/auth' });

  return sendSuccess(res, result, 200);
});
