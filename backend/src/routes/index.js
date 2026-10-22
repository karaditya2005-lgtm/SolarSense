import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import forecastRoutes from './forecast.routes.js';
import weatherRoutes from './weather.routes.js';
import adminRoutes from './admin.routes.js';
import contactRoutes from './contact.routes.js';
import { healthCheck, publicStats, dashboardSummary } from '../controllers/public.controller.js';
import { getSolarData } from '../controllers/weather.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Public & Health
router.get('/health', healthCheck);
router.get('/public/stats', publicStats);

// User dashboard summary
router.get('/dashboard/summary', authenticate, dashboardSummary);

// Solar data read-only endpoint (for reference charts)
router.get('/solar-data', authenticate, getSolarData);

// Sub-routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/forecasts', forecastRoutes);
router.use('/weather', weatherRoutes);
router.use('/admin', adminRoutes);
router.use('/contact', contactRoutes);

export default router;
