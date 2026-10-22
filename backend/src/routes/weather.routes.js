import { Router } from 'express';
import {
  geocode,
  getCurrentWeather,
  getForecastWeather,
  getWeather,
  getSolarData,
} from '../controllers/weather.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/', getWeather);
router.get('/geocode', geocode);
router.get('/current', getCurrentWeather);
router.get('/forecast', getForecastWeather);
router.get('/solar-data', getSolarData);

export default router;
