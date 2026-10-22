import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication token is required', 'TOKEN_INVALID'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Authentication token has expired', 'TOKEN_EXPIRED'));
      }
      return next(ApiError.unauthorized('Invalid authentication token', 'TOKEN_INVALID'));
    }

    // Always fetch latest user status & role from the database
    const user = await User.findById(decoded.sub).select('+passwordChangedAt');

    if (!user) {
      return next(ApiError.unauthorized('User associated with this token no longer exists', 'TOKEN_INVALID'));
    }

    if (user.status === 'suspended') {
      return next(ApiError.forbidden('Your account has been suspended. Please contact an administrator.', 'ACCOUNT_SUSPENDED'));
    }

    // If password was changed after token was issued, invalidate token
    if (user.passwordChangedAt) {
      const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < changedTimestamp) {
        return next(ApiError.unauthorized('Password recently changed. Please log in again.', 'TOKEN_EXPIRED'));
      }
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
