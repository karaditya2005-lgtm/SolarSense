export class ApiError extends Error {
  constructor(statusCode, code, message, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', code = 'BAD_REQUEST', details = []) {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED', details = []) {
    return new ApiError(401, code, message, details);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN', details = []) {
    return new ApiError(403, code, message, details);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND', details = []) {
    return new ApiError(404, code, message, details);
  }

  static conflict(message = 'Conflict', code = 'CONFLICT', details = []) {
    return new ApiError(409, code, message, details);
  }

  static unprocessableEntity(message = 'Validation error', code = 'VALIDATION_ERROR', details = []) {
    return new ApiError(422, code, message, details);
  }

  static tooManyRequests(message = 'Too many requests', code = 'RATE_LIMITED', details = []) {
    return new ApiError(429, code, message, details);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR', details = []) {
    return new ApiError(500, code, message, details);
  }

  static badGateway(message = 'External service unavailable', code = 'BAD_GATEWAY', details = []) {
    return new ApiError(502, code, message, details);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable', code = 'SERVICE_UNAVAILABLE', details = []) {
    return new ApiError(503, code, message, details);
  }

  static gatewayTimeout(message = 'Gateway timeout', code = 'GATEWAY_TIMEOUT', details = []) {
    return new ApiError(504, code, message, details);
  }
}
