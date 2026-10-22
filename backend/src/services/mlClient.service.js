import axios from 'axios';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

const mlAxios = axios.create({
  baseURL: env.ML_SERVICE_URL || 'http://localhost:8000',
  timeout: env.ML_TIMEOUT_MS || 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Key': env.ML_INTERNAL_KEY,
  },
});

export const checkMlHealth = async () => {
  try {
    const res = await mlAxios.get('/health', { timeout: 3000 });
    return res.data;
  } catch (err) {
    return { status: 'down', error: err.message };
  }
};

export const getMlModelInfo = async () => {
  try {
    const res = await mlAxios.get('/model/info');
    return res.data;
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to fetch model info from ML service');
    if (err.response?.status === 401) {
      throw ApiError.unauthorized('Internal authorization failed between backend and ML service.', 'ML_AUTH_FAILED');
    }
    throw ApiError.serviceUnavailable('ML model information is currently unavailable.', 'ML_UNAVAILABLE');
  }
};

export const predictSolarPower = async (instances, capacityKw) => {
  const payload = {
    instances,
    capacityKw,
  };

  let lastError;
  // 1 retry with backoff
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await mlAxios.post('/predict', payload);
      return res.data;
    } catch (err) {
      lastError = err;
      logger.warn(
        { attempt, error: err.message, status: err.response?.status },
        'ML inference attempt failed'
      );
      if (attempt === 1 && (!err.response || err.response.status >= 500)) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      break;
    }
  }

  if (lastError.response) {
    if (lastError.response.status === 422) {
      throw ApiError.unprocessableEntity(
        'ML service rejected input feature contract.',
        'VALIDATION_ERROR',
        lastError.response.data?.detail
      );
    }
    if (lastError.response.status === 503) {
      throw ApiError.serviceUnavailable(
        'The prediction service model is not loaded.',
        'ML_UNAVAILABLE'
      );
    }
    throw ApiError.badGateway(
      'The prediction service encountered an error while evaluating the model.',
      'ML_PREDICTION_FAILED'
    );
  }

  throw ApiError.serviceUnavailable(
    'The prediction service is unavailable. Please try again.',
    'ML_UNAVAILABLE'
  );
};
