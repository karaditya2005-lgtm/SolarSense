import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const validData = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (validData.body !== undefined) req.body = validData.body;
    if (validData.query !== undefined) req.query = validData.query;
    if (validData.params !== undefined) req.params = validData.params;

    next();
  } catch (err) {
    if (err.errors) {
      const details = err.errors.map((e) => ({
        field: e.path.slice(1).join('.') || e.path[0] || 'input',
        message: e.message,
      }));
      return next(ApiError.unprocessableEntity('Input validation failed', 'VALIDATION_ERROR', details));
    }
    next(err);
  }
};
