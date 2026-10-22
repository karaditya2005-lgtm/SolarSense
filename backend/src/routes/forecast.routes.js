import { Router } from 'express';
import {
  create,
  list,
  getById,
  rerun,
  remove,
  getStats,
  getActiveModelInfo,
} from '../controllers/forecast.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { forecastLimiter } from '../middleware/rateLimit.js';
import {
  createForecastSchema,
  getForecastsQuerySchema,
} from '../validators/forecastValidators.js';

const router = Router();

router.use(authenticate);

router.post('/', forecastLimiter, validate(createForecastSchema), create);
router.get('/', validate(getForecastsQuerySchema), list);
router.get('/stats', getStats);
router.get('/model', getActiveModelInfo);
router.get('/:id', getById);
router.post('/:id/rerun', forecastLimiter, rerun);
router.delete('/:id', remove);

export default router;
