import { Router } from 'express';
import multer from 'multer';
import {
  stats,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  listSolarData,
  getSolarDataRecord,
  createSolarData,
  updateSolarData,
  deleteSolarData,
  importSolarData,
  exportSolarData,
  listForecasts,
  getForecast,
  deleteForecastAdmin,
  forecastActivity,
  listMessages,
  updateMessageStatus,
  deleteMessage,
  listSettings,
  updateSettingKey,
  listLogs,
  getModelInfo,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { adminUpdateUserSchema } from '../validators/userValidators.js';
import {
  createSolarDataSchema,
  updateSolarDataSchema,
} from '../validators/solarDataValidators.js';
import { updateContactStatusSchema } from '../validators/contactValidators.js';
import { updateSettingSchema } from '../validators/settingValidators.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Protect all admin routes at router level
router.use(authenticate);
router.use(authorize('admin'));

// Stats & Activity
router.get('/stats', stats);
router.get('/forecasts/activity', forecastActivity);

// User Management
router.get('/users', listUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id', validate(adminUpdateUserSchema), updateUser);
router.delete('/users/:id', deleteUser);

// Solar Benchmark Data Management
router.get('/solar-data', listSolarData);
router.post('/solar-data', validate(createSolarDataSchema), createSolarData);
router.get('/solar-data/export', exportSolarData);
router.post('/solar-data/import', upload.single('file'), importSolarData);
router.get('/solar-data/:id', getSolarDataRecord);
router.patch('/solar-data/:id', validate(updateSolarDataSchema), updateSolarData);
router.delete('/solar-data/:id', deleteSolarData);

// Forecast Management
router.get('/forecasts', listForecasts);
router.get('/forecasts/:id', getForecast);
router.delete('/forecasts/:id', deleteForecastAdmin);

// Contact Messages
router.get('/messages', listMessages);
router.patch('/messages/:id', validate(updateContactStatusSchema), updateMessageStatus);
router.delete('/messages/:id', deleteMessage);

// Application Settings
router.get('/settings', listSettings);
router.patch('/settings/:key', validate(updateSettingSchema), updateSettingKey);

// System Audit Logs
router.get('/logs', listLogs);

// ML Model Introspection
router.get('/model', getModelInfo);

export default router;
