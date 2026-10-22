import { getMe, updateMe, deleteMe } from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await getMe(req.user._id);
  return sendSuccess(res, { user }, 200);
});

export const updateCurrentUser = asyncHandler(async (req, res) => {
  const user = await updateMe(req.user._id, req.body, req.id);
  return sendSuccess(res, { user }, 200);
});

export const deleteCurrentUser = asyncHandler(async (req, res) => {
  await deleteMe(req.user._id, req.body.password, req.id);
  res.clearCookie('refreshToken', { path: '/api/auth' });
  return res.status(204).send();
});
