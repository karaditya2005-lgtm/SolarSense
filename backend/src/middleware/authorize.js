import { ApiError } from '../utils/ApiError.js';

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required', 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          'You do not have permission to perform this action',
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};
