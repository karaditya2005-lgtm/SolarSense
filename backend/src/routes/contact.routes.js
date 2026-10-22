import { Router } from 'express';
import { submitContactMessage } from '../controllers/contact.controller.js';
import { validate } from '../middleware/validate.js';
import { createContactSchema } from '../validators/contactValidators.js';
import { contactLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/', contactLimiter, validate(createContactSchema), submitContactMessage);

export default router;
