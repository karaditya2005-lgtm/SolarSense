import { Router } from 'express';
import {
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { updateMeSchema, deleteMeSchema } from '../validators/userValidators.js';

const router = Router();

router.use(authenticate);

router.get('/me', getCurrentUser);
router.patch('/me', validate(updateMeSchema), updateCurrentUser);
router.delete('/me', validate(deleteMeSchema), deleteCurrentUser);

export default router;
