import { ApiError } from '../utils/ApiError.js';
import { sendError } from '../utils/response.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Convert known Mongoose / JWT errors to ApiError
  if (!(error instanceof ApiError)) {
    if (err.name === 'ValidationError') {
      const details = Object.values(err.errors || {}).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      error = ApiError.unprocessableEntity('Database validation failed', 'VALIDATION_ERROR', details);
    } else if (err.name === 'CastError') {
      error = ApiError.notFound(`Resource not found with id: ${err.value}`, 'NOT_FOUND');
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      error = ApiError.conflict(`Duplicate value for field '${field}'.`, 'CONFLICT');
    } else if (err.name === 'JsonWebTokenError') {
      error = ApiError.unauthorized('Invalid authentication token', 'TOKEN_INVALID');
    } else if (err.name === 'TokenExpiredError') {
      error = ApiError.unauthorized('Authentication token expired', 'TOKEN_EXPIRED');
    } else {
      error = new ApiError(
        err.statusCode || 500,
        err.code || 'INTERNAL_ERROR',
        err.message || 'An unexpected internal server error occurred',
        err.details || []
      );
    }
  }

  // Structured logging
  logger.error(
    {
      requestId: req.id,
      url: req.originalUrl,
      method: req.method,
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      stack: env.NODE_ENV !== 'production' ? err.stack : undefined,
    },
    'Request Error Handler'
  );

  return sendError(
    res,
    {
      code: error.code,
      message: error.message,
      details: error.details,
    },
    error.statusCode,
    req.id
  );
};
