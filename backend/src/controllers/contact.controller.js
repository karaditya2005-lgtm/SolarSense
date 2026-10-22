import { ContactMessage } from '../models/ContactMessage.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logSystemEvent } from '../services/log.service.js';

export const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  const contact = await ContactMessage.create({
    name,
    email,
    subject,
    message,
    userId: req.user?._id || undefined,
  });

  await logSystemEvent({
    level: 'info',
    type: 'system',
    action: 'CONTACT_MESSAGE_SUBMITTED',
    actorId: req.user?._id || null,
    targetType: 'ContactMessage',
    targetId: contact._id,
    message: `Contact inquiry received from ${name} (${email}): ${subject}`,
    requestId: req.id,
  });

  return sendSuccess(res, { id: contact._id, message: 'Thank you! Your message has been received.' }, 201);
});
